import {Router} from 'express';
import {
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user.controller.js';
import {verifyToken} from '../middlewares/index.js';

const router = Router();

// All user routes require a valid token
router.use(verifyToken);

router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
