import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

interface CsvRow {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate: string;
  role?: string;
}

export const importEmployeesCsv = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const csvText = req.file.buffer.toString('utf-8');

    let rows: CsvRow[];
    try {
      rows = parse(csvText, {
        columns: true,       // use the first row as field names
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return res.status(400).json({ message: 'Invalid CSV format' });
    }

    const results = {
      created: 0,
      skipped: [] as { row: number; reason: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 accounts for the header row + 0-index

      // Basic per-row validation — skip bad rows instead of failing the whole import
      if (!row.employeeCode || !row.name || !row.email || !row.phone || !row.password) {
        results.skipped.push({ row: rowNum, reason: 'Missing required field(s)' });
        continue;
      }

      const existing = await prisma.employee.findUnique({ where: { email: row.email } });
      if (existing) {
        results.skipped.push({ row: rowNum, reason: `Email ${row.email} already exists` });
        continue;
      }

      // HR cannot bulk-import Super Admins — same rule as the single-create endpoint
      const requestedRole = row.role?.toUpperCase() || 'EMPLOYEE';
      if (req.user!.role === 'HR_MANAGER' && requestedRole === 'SUPER_ADMIN') {
        results.skipped.push({ row: rowNum, reason: 'HR Manager cannot assign Super Admin role' });
        continue;
      }

      try {
        const passwordHash = await bcrypt.hash(row.password, 10);
        await prisma.employee.create({
          data: {
            employeeCode: row.employeeCode,
            name: row.name,
            email: row.email,
            phone: row.phone,
            passwordHash,
            department: row.department || 'Unassigned',
            designation: row.designation || 'Employee',
            salary: parseFloat(row.salary) || 0,
            joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
            role: requestedRole as any,
            status: 'ACTIVE',
          },
        });
        results.created++;
      } catch (rowErr) {
        results.skipped.push({ row: rowNum, reason: 'Failed to create (check field formats)' });
      }
    }

    res.json({
      message: `Import complete: ${results.created} created, ${results.skipped.length} skipped`,
      ...results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'CSV import failed' });
  }
};