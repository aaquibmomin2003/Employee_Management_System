import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [total, active, inactive, departments] = await Promise.all([
      prisma.employee.count({ where: { isDeleted: false } }),
      prisma.employee.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { isDeleted: false, status: 'INACTIVE' } }),
      prisma.employee.findMany({
        where: { isDeleted: false },
        select: { department: true },
        distinct: ['department'],
      }),
    ]);

    // Bonus: per-department breakdown for a dashboard chart
    const departmentCounts = await prisma.employee.groupBy({
      by: ['department'],
      where: { isDeleted: false },
      _count: { department: true },
    });

    res.json({
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
      departmentCount: departments.length,
      departmentBreakdown: departmentCounts.map((d) => ({
        department: d.department,
        count: d._count.department,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};