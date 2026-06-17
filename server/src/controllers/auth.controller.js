import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
        {expiresIn: '5m'}
    );

/**
 * Creates a cryptographically random opaque refresh token (7 days).
 * Stored as a hash in the DB; the raw value is sent to the client.
 */
const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

/**
 * Helper — issue both tokens, persist the refresh token, set both cookies.
 */
const issueTokens = async (res, user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Persist the new refresh token in DB (replaces any existing one — rotation)
    await User.setRefreshToken(user.id, refreshToken);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return {accessToken, refreshToken};
};

// ─── Controllers ─────────────────────────────────────────────────────────────

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
 * Validates the refresh token cookie against the DB.
 * On success, issues a brand-new access token AND rotates the refresh token
 * (old one is replaced in DB — prevents replay attacks).
 */
const refresh = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Refresh token is missing.'
        );
    }

    // Look up user by the raw refresh token stored in DB
    const user = await User.findByRefreshToken(incomingRefreshToken);

    if (!user) {
        // Token not found in DB — it was already rotated or is invalid.
        // Clear stale cookies defensively.
        res.clearCookie('accessToken', accessTokenCookieOptions);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Invalid or expired refresh token. Please log in again.'
        );
    }

    // Issue a fresh access token and rotate the refresh token
    await issueTokens(res, user);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Token refreshed successfully.'));
});

export {register, login, logout, refresh};
