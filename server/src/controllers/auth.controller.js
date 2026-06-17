import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
} from '../constants/cookieOptions.js';

const SALT_ROUNDS = 12;

/**
 * Signs a short-lived access token (5 minutes).
 * Verified using JWT_ACCESS_SECRET.
 */
const generateAccessToken = (user) =>
    jwt.sign(
        {userId: user.id, username: user.username, role: user.role},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '5m'}
    );

/**
 * Signs a long-lived refresh token (7 days).
 * Verified using JWT_REFRESH_SECRET — separate from the access token secret.
 * Storing a JWT in the DB allows cryptographic validation (signature + expiry)
 * BEFORE the DB lookup, which serves as the rotation guard.
 */
const generateRefreshToken = (user) =>
    jwt.sign(
        {userId: user.id},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'}
    );

/**
 * Helper — issue both tokens, persist the refresh token, set both cookies.
 */
const issueTokens = async (res, user) => {
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist the new refresh token in DB (replaces any existing one — rotation)
    await User.setRefreshToken(user.id, refreshToken);

    res.cookie('accessToken',  accessToken,  accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return {accessToken, refreshToken};
};


const register = asyncHandler(async (req, res) => {
    const {username, name, institute, email, password} = req.body;

    if (!username || !name || !email || !password) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'username, name, email and password are required.'
        );
    }

    const existingByUsername = await User.findByUsername(username);
    if (existingByUsername) {
        throw new ApiError(statusCode.CONFLICT, 'Username is already taken.');
    }

    const existingByEmail = await User.findByEmail(email);
    if (existingByEmail) {
        throw new ApiError(
            statusCode.CONFLICT,
            'Email is already registered.'
        );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const insertId = await User.create({
        username,
        name,
        institute: institute || null,
        email,
        password: hashedPassword,
        rating: 0,
        max_rating: 0,
        role: 'user',
    });

    const newUser = await User.findById(insertId);

    await issueTokens(res, newUser);

    const {password: _pw, refresh_token: _rt, ...safeUser} = newUser;

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Registration successful.',
                safeUser
            )
        );
});

const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Email and password are required.'
        );
    }

    const user = await User.findByEmail(email);
    if (!user) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Invalid email or password.'
        );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Invalid email or password.'
        );
    }

    await issueTokens(res, user);

    const {password: _pw, refresh_token: _rt, ...safeUser} = user;

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Login successful.', safeUser));
});

const logout = asyncHandler(async (req, res) => {
    // The refresh token cookie identifies the session — null it in the DB
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
        const user = await User.findByRefreshToken(incomingRefreshToken);
        if (user) {
            await User.clearRefreshToken(user.id);
        }
    }

    return res
        .status(statusCode.OK)
        .clearCookie('accessToken', accessTokenCookieOptions)
        .clearCookie('refreshToken', refreshTokenCookieOptions)
        .json(new ApiResponse(statusCode.OK, 'Logout successful.'));
});

/**
 * POST /auth/refresh
 *
 * Two-layer validation:
 *   1. JWT verification (signature + expiry) — catches tampered/forged tokens
 *      without touching the DB at all.
 *   2. DB lookup — confirms the token hasn't been rotated out (replay protection).
 *
 * On success, issues a new access token AND rotates the refresh token.
 */
const refresh = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Refresh token is missing.'
        );
    }

    // ── Layer 1: Cryptographic validation ────────────────────────────────────
    // Verify signature and expiry using JWT_REFRESH_SECRET.
    // If the token was forged, tampered with, or simply expired, this throws
    // before we ever hit the database.
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        // Clear stale cookies on any JWT error
        res.clearCookie('accessToken', accessTokenCookieOptions);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);

        if (error.name === 'TokenExpiredError') {
            throw new ApiError(
                statusCode.UNAUTHORIZED,
                'Refresh token has expired. Please log in again.'
            );
        }
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Invalid refresh token. Please log in again.'
        );
    }

    // ── Layer 2: DB rotation check ───────────────────────────────────────────
    // Even a cryptographically valid token is rejected if it no longer matches
    // what's stored in the DB — meaning it has already been rotated out.
    // This is what prevents replay attacks with stolen refresh tokens.
    const user = await User.findByRefreshToken(incomingRefreshToken);

    if (!user) {
        // Token is valid JWT but not in DB — it was already rotated.
        // This could mean a replay attack: clear cookies and force re-login.
        res.clearCookie('accessToken', accessTokenCookieOptions);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Refresh token has already been used or revoked. Please log in again.'
        );
    }

    // Extra sanity check: decoded.userId should match the DB row
    if (decoded.userId !== user.id) {
        res.clearCookie('accessToken', accessTokenCookieOptions);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Token mismatch. Please log in again.'
        );
    }

    // ── Issue new tokens (rotation) ──────────────────────────────────────────
    await issueTokens(res, user);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Token refreshed successfully.'));
});

export {register, login, logout, refresh};
