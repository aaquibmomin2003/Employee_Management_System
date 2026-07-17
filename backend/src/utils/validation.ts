import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  salary: z.number().positive('Salary must be positive'),
  joiningDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
  managerId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true });

// Restricted fields an EMPLOYEE is allowed to edit on their own profile
export const employeeSelfUpdateSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
  profileImageUrl: z.string().url().nullable().optional(),
});