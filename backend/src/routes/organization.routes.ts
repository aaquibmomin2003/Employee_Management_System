import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getOrganizationTree } from '../controllers/organization.controller';

const router = Router();

router.use(authenticate);
router.get('/tree', getOrganizationTree);

export default router;