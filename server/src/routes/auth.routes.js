import {Router} from 'express';
import {register, login, logout, refresh} from '../controllers/auth.controller.js';
import {authLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes with rate limit
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Refresh — uses the refresh token cookie; no access token required
router.post('/refresh', authLimiter, refresh);

// Logout — identifies the session via the refresh token cookie; no access token required
// (access token may already be expired when the user clicks logout)
router.post('/logout', logout);

export default router;
