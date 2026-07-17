import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { signToken } from '../utils/jwt';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });

    if (!employee || employee.isDeleted) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }

    const token = signToken({ id: employee.id, role: employee.role });

    // Never send passwordHash back to the client
    const { passwordHash, ...safeEmployee } = employee;

    res.json({ token, user: safeEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  // JWTs are stateless — logout is handled client-side by deleting the token.
  // This endpoint exists for API completeness and future blacklist support.
  res.json({ message: 'Logged out successfully' });
};