import {Router} from 'express';
import {
    register,
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
} from '../controllers/auth.controller.js';
import {
    authLimiter,
    passwordResetLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes with rate limit
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Refresh — uses the refresh token cookie; no access token required
router.post('/refresh', authLimiter, refresh);

// Logout — identifies the session via the refresh token cookie; no access token required
// (access token may already be expired when the user clicks logout)
router.post('/logout', logout);

// Password reset flow — strict rate limit (5 per 5 min) to prevent brute-force
// Both endpoints are public (the token itself is the auth for reset-password)
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

export default router;
