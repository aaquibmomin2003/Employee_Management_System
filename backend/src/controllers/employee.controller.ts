import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeSelfUpdateSchema,
} from '../utils/validation';
import { wouldCreateCycle } from '../utils/hierarchy';

const sanitize = (employee: any) => {
  const { passwordHash, ...safe } = employee;
  return safe;
};

// GET /api/employees  (list, with search/filter/sort/pagination)
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) || 'desc';
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';

    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.department = department;
    if (role) where.role = role;
    if (status) where.status = status;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [sortBy]: order === 'asc' ? 'asc' : 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      data: employees.map(sanitize),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
};

// GET /api/employees/:id
export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Employee role can only view their own profile
    if (req.user!.role === 'EMPLOYEE' && req.user!.id !== id) {
      return res.status(403).json({ message: 'Forbidden: you can only view your own profile' });
    }

    const employee = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    res.json(sanitize(employee));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employee' });
  }
};

// POST /api/employees  (Super Admin, HR only)
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const data = parsed.data;

    // HR cannot create a Super Admin
    if (req.user!.role === 'HR_MANAGER' && data.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'HR Manager cannot assign Super Admin role' });
    }

    const existing = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        department: data.department,
        designation: data.designation,
        salary: data.salary,
        joiningDate: new Date(data.joiningDate),
        role: data.role || 'EMPLOYEE',
        status: data.status || 'ACTIVE',
        managerId: data.managerId || null,
      },
    });

    res.status(201).json(sanitize(employee));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create employee' });
  }
};

// PUT /api/employees/:id  (Super Admin, HR — full edit; Employee — self, limited fields)
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const isSelf = req.user!.id === id;
    const isElevated = req.user!.role === 'SUPER_ADMIN' || req.user!.role === 'HR_MANAGER';

    if (!isElevated && !isSelf) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const target = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!target) return res.status(404).json({ message: 'Employee not found' });

    // Case 1: Employee editing their own profile — restricted field set
    if (req.user!.role === 'EMPLOYEE') {
      const parsed = employeeSelfUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      }
      const updated = await prisma.employee.update({ where: { id }, data: parsed.data });
      return res.json(sanitize(updated));
    }

    // Case 2: Super Admin / HR editing any employee — full field set
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const data = parsed.data;

    if (req.user!.role === 'HR_MANAGER' && data.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'HR Manager cannot assign Super Admin role' });
    }

    if (data.managerId) {
      const cycle = await wouldCreateCycle(id, data.managerId);
      if (cycle) {
        return res.status(400).json({ message: 'Invalid manager: would create a circular reporting chain' });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      },
    });

    res.json(sanitize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update employee' });
  }
};

// DELETE /api/employees/:id  (Super Admin ONLY, soft delete)
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const target = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!target) return res.status(404).json({ message: 'Employee not found' });

    await prisma.employee.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: 'INACTIVE' },
    });

    res.json({ message: 'Employee deleted (soft delete)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};