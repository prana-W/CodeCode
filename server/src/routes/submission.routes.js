import {Router} from 'express';
import {
    createSubmission,
    getContestSubmissions,
    getSubmissionById,
} from '../controllers/submission.controller.js';
import {verifyToken} from '../middlewares/index.js';

const router = Router();

router.use(verifyToken);

router.post('/', createSubmission);
router.get('/', getContestSubmissions);
router.get('/:id', getSubmissionById);

export default router;
