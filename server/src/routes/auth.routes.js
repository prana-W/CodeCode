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
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);

router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

export default router;
