import {Router} from 'express';
import {
    getMe,
    getUserById,
    getUserByUsername,
    getRankings,
    updateUser,
    deleteUser,
    getContestHistory,
    getActivityStats,
} from '../controllers/user.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {profileUpdateLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All user routes require a valid token
router.use(verifyToken);

// Current authenticated user — used by AuthContext to hydrate user state
router.get('/me', getMe);

router.get('/rankings', getRankings);
router.get('/username/:username', getUserByUsername);
router.get('/username/:username/contest-history', getContestHistory);
router.get('/username/:username/activity-stats', getActivityStats);
router.get('/:id', getUserById);
router.patch('/:id', profileUpdateLimiter, updateUser);
router.delete('/:id', deleteUser);

export default router;
