import {Router} from 'express';
import {register, login, logout} from '../controllers/auth.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {authLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes with rate limit
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected route — user must be logged in to log out
router.post('/logout', verifyToken, logout);

export default router;
