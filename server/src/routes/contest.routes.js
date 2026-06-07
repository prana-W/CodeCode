import {Router} from 'express';
import {
    createContest,
    updateContest,
    toggleVerifyContest,
    deleteContest,
    getContestById,
    getAllContests,
    getMyContests,
    getLeaderboard,
    registerForContest,
    checkRegistration,
    finalizeContest,
} from '../controllers/contest.controller.js';
import {verifyToken, verifyAdmin} from '../middlewares/index.js';
import {
    contestCreationLimiter,
    contestRegistrationLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All contest routes require a valid token
router.use(verifyToken);

router.post('/', contestCreationLimiter, createContest);
router.get('/', getAllContests);
router.get('/my', getMyContests);
router.get('/:id', getContestById);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/register', contestRegistrationLimiter, registerForContest);
router.get('/register/status', checkRegistration);
router.patch('/:id', updateContest);
router.patch('/:id/verify', verifyAdmin, toggleVerifyContest);
router.post('/:id/finalize', verifyAdmin, finalizeContest);
router.delete('/:id', deleteContest);

export default router;
