import {Router} from 'express';
import {
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {profileUpdateLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All user routes require a valid token
router.use(verifyToken);

router.get('/:id', getUserById);
router.patch('/:id', profileUpdateLimiter, updateUser);
router.delete('/:id', deleteUser);

export default router;
