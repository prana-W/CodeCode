import {Router} from 'express';
import {
    askDecoAssistant,
    askExternalAssistant,
    askExternalAssistantStream,
} from '../controllers/ai.controller.js';
import {verifyToken} from '../middlewares/index.js';
import {aiLimiter} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All AI routes require a valid token
router.use(verifyToken);

router.post('/deco', aiLimiter, askDecoAssistant);
router.post('/external', aiLimiter, askExternalAssistant);
router.post('/external/stream', aiLimiter, askExternalAssistantStream);

export default router;
