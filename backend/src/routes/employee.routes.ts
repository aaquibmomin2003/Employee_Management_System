import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller';
import { getReportees, assignManager } from '../controllers/organization.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), getEmployees);
router.get('/:id', getEmployeeById);
router.get('/:id/reportees', getReportees);
router.post('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), createEmployee);
router.put('/:id', updateEmployee);
router.patch('/:id/manager', authorize('SUPER_ADMIN', 'HR_MANAGER'), assignManager);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteEmployee);

export default router;