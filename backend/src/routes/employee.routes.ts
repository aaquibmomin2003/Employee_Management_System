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

const router = Router();

router.use(authenticate); // every route below requires a valid JWT

router.get('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), getEmployees);
router.get('/:id', getEmployeeById); // fine-grained self-check happens inside the controller
router.post('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), createEmployee);
router.put('/:id', updateEmployee); // fine-grained self-vs-elevated check happens inside the controller
router.delete('/:id', authorize('SUPER_ADMIN'), deleteEmployee);

export default router;