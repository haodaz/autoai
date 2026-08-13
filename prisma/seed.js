const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('198749', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'haoz214' },
    update: { passwordHash: hash, role: 'admin' },
    create: {
      username: 'haoz214',
      passwordHash: hash,
      role: 'admin',
      displayName: 'Hao (Admin)',
    },
  });
  console.log('✅ Admin account seeded:', admin.username, admin.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
