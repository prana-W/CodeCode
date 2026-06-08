import {Router} from 'express';
import {
    createSubmission,
    getContestSubmissions,
    getSubmissionById,
    getSubmissionCounts,
    getSolvedProblems,
    runAgainstSample,
} from '../controllers/submission.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {submissionLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All submission routes require a valid token
router.use(verifyToken);

router.get('/counts', getSubmissionCounts);
router.get('/solved', getSolvedProblems);
router.post('/run-sample', submissionLimiter, runAgainstSample);
router.post('/', submissionLimiter, createSubmission);
router.get('/', getContestSubmissions);
router.get('/:id', getSubmissionById);

export default router;
