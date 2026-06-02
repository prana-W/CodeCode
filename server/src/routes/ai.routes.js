import {Router} from 'express';
import {askAssistant} from '../controllers/ai.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {aiLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All AI routes require a valid token
router.use(verifyToken);

router.post('/ask', aiLimiter, askAssistant);

export default router;
