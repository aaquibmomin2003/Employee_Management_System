import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { upload } from '../middleware/upload.middleware';
import { importEmployeesCsv } from '../controllers/import.controller';

const router = Router();

router.use(authenticate);
router.post('/employees', authorize('SUPER_ADMIN', 'HR_MANAGER'), upload.single('file'), importEmployeesCsv);

export default router;