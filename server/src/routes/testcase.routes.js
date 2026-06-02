import {Router} from 'express';
import {
    createTestCase,
    updateTestCase,
    deleteTestCase,
    getAllTestCases,
} from '../controllers/testcase.controller.js';
import {verifyToken} from '../middlewares/index.js';

const router = Router();

router.use(verifyToken);

router.post('/', createTestCase);
router.get('/', getAllTestCases);
router.patch('/:id', updateTestCase);
router.delete('/:id', deleteTestCase);

export default router;
