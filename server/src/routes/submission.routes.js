import {Router} from 'express';
import {
    createSubmission,
    getContestSubmissions,
    getSubmissionById,
} from '../controllers/submission.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {submissionLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/', submissionLimiter, createSubmission);
router.get('/', getContestSubmissions);
router.get('/:id', getSubmissionById);

export default router;
