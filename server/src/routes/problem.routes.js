import {Router} from 'express';
import {
    createProblem,
    updateProblem,
    deleteProblem,
    getAllProblems,
    getProblemById,
} from '../controllers/problem.controller.js';
import {verifyToken} from '../middlewares/index.js';

const router = Router();

// All problem routes require a valid token
router.use(verifyToken);

router.post('/', createProblem);
router.get('/', getAllProblems);
router.get('/:id', getProblemById);
router.patch('/:id', updateProblem);
router.delete('/:id', deleteProblem);

export default router;
