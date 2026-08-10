import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
    clearCookieOptions,
} from '../constants/cookieOptions.js';
import redis from '../config/redis.js';
import emailQueue from '../queues/emailQueue.js';
import {buildPasswordResetEmail} from '../constants/emailTemplates.js';

const SALT_ROUNDS = 12;

const generateAccessToken = (user) =>
    jwt.sign(
        {userId: user.id, username: user.username, role: user.role},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '5m'}
    );

const generateRefreshToken = (user) =>
    jwt.sign({userId: user.id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

/**
 * Helper — issue both tokens, persist the refresh token, set both cookies.
 */
const issueTokens = async (res, user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist the new refresh token in DB (replaces any existing one — rotation)
    await User.setRefreshToken(user.id, refreshToken);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
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
        throw new ApiError(statusCode.CONFLICT, 'Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await User.create({
        username,
        name,
        institute: institute || null,
        email,
        password: hashedPassword,
        rating: 0,
        max_rating: 0,
        role: 'user',
    });

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Registration successful. Please sign in.'
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
        .clearCookie('accessToken', clearCookieOptions)
        .clearCookie('refreshToken', clearCookieOptions)
        .json(new ApiResponse(statusCode.OK, 'Logout successful.'));
});

const refresh = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Session Expired. Kindly login back again!'
        );
    }

    let decoded;
    try {
        decoded = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (error) {
        // Clear stale cookies on any JWT error
        res.clearCookie('accessToken', clearCookieOptions);
        res.clearCookie('refreshToken', clearCookieOptions);

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

    const user = await User.findByRefreshToken(incomingRefreshToken);

    if (!user) {
        res.clearCookie('accessToken', clearCookieOptions);
        res.clearCookie('refreshToken', clearCookieOptions);
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Refresh token has already been used or revoked. Please log in again.'
        );
    }

    // Extra sanity check: decoded.userId should match the DB row
    if (decoded.userId !== user.id) {
        res.clearCookie('accessToken', clearCookieOptions);
        res.clearCookie('refreshToken', clearCookieOptions);
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Token mismatch. Please log in again.'
        );
    }

    await issueTokens(res, user);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Token refreshed successfully.'));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const {email} = req.body;

    if (!email) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Email is required.');
    }

    const GENERIC_RESPONSE =
        'If that email is registered, a password reset link has been sent.';

    const user = await User.findByEmail(email);

    if (user) {
        const rawToken = crypto.randomBytes(64).toString('hex');

        const hashedToken = await bcrypt.hash(rawToken, 10);

        const redisKey = `reset:${user.id}`;
        await redis.set(redisKey, hashedToken, 'EX', 300);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?userid=${user.id}&token=${rawToken}`;

        // Enqueue email job — picked up by emailWorker
        await emailQueue.add('send-reset-email', {
            to: user.email,
            subject: 'Reset your CodeCode password',
            html: buildPasswordResetEmail(user.name, resetLink),
        });

        console.log(
            `[ForgotPassword] Reset email queued for user ${user.id} (${user.email})`
        );
    }

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, GENERIC_RESPONSE));
});

const resetPassword = asyncHandler(async (req, res) => {
    const {userId, token, newPassword} = req.body;

    if (!userId || !token || !newPassword) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'userId, token and newPassword are required.'
        );
    }

    // Minimum password length — matches registration requirement
    if (newPassword.length < 8) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Password must be at least 8 characters.'
        );
    }

    const redisKey = `reset:${userId}`;

    const hashedToken = await redis.get(redisKey);
    if (!hashedToken) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Reset link has expired or is invalid. Please request a new one.'
        );
    }

    const isValid = await bcrypt.compare(token, hashedToken);
    if (!isValid) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Reset link has expired or is invalid. Please request a new one.'
        );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.updatePassword(userId, hashedPassword);

    await User.clearRefreshToken(userId);

    await redis.del(redisKey);

    res.clearCookie('accessToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Password reset successfully. Please log in with your new password.'
            )
        );
});

export {register, login, logout, refresh, forgotPassword, resetPassword};
