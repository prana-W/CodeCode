import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/index.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route — user must be logged in to log out
router.post('/logout', verifyToken, logout);

export default router;
