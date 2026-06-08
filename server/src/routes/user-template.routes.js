import { Router } from 'express';
import { verifyToken } from '../middlewares/index.js';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getOngoingContestStatus
} from '../controllers/user-template.controller.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.get('/ongoing-contest-status', getOngoingContestStatus);

router.route('/')
    .get(getTemplates)
    .post(createTemplate);

router.route('/:id')
    .get(getTemplateById)
    .put(updateTemplate)
    .delete(deleteTemplate);

router.put('/:id/default', setDefaultTemplate);

export default router;
