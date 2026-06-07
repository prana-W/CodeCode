import {Router} from 'express';
import {
    getUserById,
    getUserByUsername,
    getRankings,
    updateUser,
    deleteUser,
    heartbeat,
    getContestHistory,
} from '../controllers/user.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {profileUpdateLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All user routes require a valid token
router.use(verifyToken);

router.post('/heartbeat', heartbeat);
router.get('/rankings', getRankings);
router.get('/username/:username', getUserByUsername);
router.get('/username/:username/contest-history', getContestHistory);
router.get('/:id', getUserById);
router.patch('/:id', profileUpdateLimiter, updateUser);
router.delete('/:id', deleteUser);

export default router;
