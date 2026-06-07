import {Router} from 'express';
import {
    runCustomInvocation,
    getCustomInvocationStatus,
} from '../controllers/custom-invocation.controller.js';
import {verifyToken} from '../middlewares/index.js';

const router = Router();

// Require authorization for all custom invocation routes
router.use(verifyToken);

router.post('/', runCustomInvocation);
router.get('/status/:customInvocationId', getCustomInvocationStatus);

export default router;
