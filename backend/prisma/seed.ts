import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.employee.upsert({
    where: { email: 'admin@ems.com' },
    update: {},
    create: {
      employeeCode: 'EMP001',
      name: 'Super Admin',
      email: 'admin@ems.com',
      phone: '9999999999',
      passwordHash,
      department: 'Administration',
      designation: 'Super Admin',
      salary: 100000,
      joiningDate: new Date(),
      status: 'ACTIVE',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seeded Super Admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });