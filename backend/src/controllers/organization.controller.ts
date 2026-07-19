import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { wouldCreateCycle } from '../utils/hierarchy';
import { z } from 'zod';

const sanitize = (employee: any) => {
  const { passwordHash, ...safe } = employee;
  return safe;
};

interface TreeNode {
  id: string;
  name: string;
  designation: string;
  department: string;
  role: string;
  status: string;
  directReports: TreeNode[];
}

const buildTree = (employees: any[], managerId: string | null = null): TreeNode[] => {
  return employees
    .filter((e) => e.managerId === managerId)
    .map((e) => ({
      id: e.id,
      name: e.name,
      designation: e.designation,
      department: e.department,
      role: e.role,
      status: e.status,
      directReports: buildTree(employees, e.id),
    }));
};

// GET /api/organization/tree
export const getOrganizationTree = async (_req: AuthRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        designation: true,
        department: true,
        role: true,
        status: true,
        managerId: true,
      },
    });

    const tree = buildTree(employees, null);

    res.json({ tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to build organization tree' });
  }
};

// GET /api/employees/:id/reportees
export const getReportees = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const manager = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!manager) return res.status(404).json({ message: 'Employee not found' });

    const reportees = await prisma.employee.findMany({
      where: { managerId: id, isDeleted: false },
    });

    res.json({ data: reportees.map(sanitize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reportees' });
  }
};

const assignManagerSchema = z.object({
  managerId: z.string().uuid().nullable(),
});

// PATCH /api/employees/:id/manager  (Super Admin, HR only)
export const assignManager = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = assignManagerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const { managerId } = parsed.data;

    const target = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!target) return res.status(404).json({ message: 'Employee not found' });

    if (managerId) {
      const manager = await prisma.employee.findFirst({ where: { id: managerId, isDeleted: false } });
      if (!manager) return res.status(404).json({ message: 'Manager not found' });

      const cycle = await wouldCreateCycle(id, managerId);
      if (cycle) {
        return res.status(400).json({ message: 'Invalid manager: would create a circular reporting chain' });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { managerId },
    });

    res.json(sanitize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign manager' });
  }
};