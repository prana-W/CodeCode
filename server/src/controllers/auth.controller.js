import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
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

    const user = await User.findByRefreshToken(incomingRefreshToken);

    if (!user) {
   
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
        // 128-character hex token — computationally infeasible to brute-force
        const rawToken = crypto.randomBytes(64).toString('hex');

        // Hash before storing — Redis compromise cannot expose the raw token
        const hashedToken = await bcrypt.hash(rawToken, 10);

        // Store in Redis with 5-minute TTL
        const redisKey = `reset:${user.id}`;
        await redis.set(redisKey, hashedToken, 'EX', 300);

        // Build the reset link
        const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:5173';
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

    res.clearCookie('accessToken', accessTokenCookieOptions);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Password reset successfully. Please log in with your new password.'
            )
        );
});


function buildResetEmailHtml(name, resetLink) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your CodeCode password</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CodeCode</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Competitive Programming Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:22px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#a0a0a0;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#e0e0e0;">${name}</strong>,<br/>
                We received a request to reset the password for your CodeCode account.
                Click the button below to choose a new password.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                          text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;
                          border-radius:8px;letter-spacing:0.3px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;line-height:1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetLink}" style="color:#818cf8;font-size:12px;">${resetLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;"/>
              <p style="margin:0;color:#6b6b6b;font-size:12px;line-height:1.6;">
                ⏱ This link expires in <strong style="color:#a0a0a0;">5 minutes</strong>.<br/>
                🔒 If you did not request a password reset, you can safely ignore this email — your password will not change.<br/>
                This is an automated message; please do not reply.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#141414;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#4a4a4a;font-size:12px;">© 2025 CodeCode. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export {register, login, logout, refresh, forgotPassword, resetPassword};
