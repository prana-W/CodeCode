import {Router} from 'express';
import {
    createContest,
    updateContest,
    toggleVerifyContest,
    deleteContest,
    getContestById,
    getAllContests,
    getLeaderboard,
} from '../controllers/contest.controller.js';
import {verifyToken, verifyAdmin} from '../middlewares/index.js';

const router = Router();

// All contest routes require a valid token
router.use(verifyToken);

router.post('/', createContest);
router.get('/', getAllContests);
router.get('/:id', getContestById);
router.get('/:id/leaderboard', getLeaderboard);
router.patch('/:id', updateContest);
router.patch('/:id/verify', verifyAdmin, toggleVerifyContest);
router.delete('/:id', deleteContest);

export default router;
