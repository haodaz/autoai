const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findFirst({
    where: { agent: 'Edda' },
    orderBy: { createdAt: 'desc' },
  });
  console.log(task);
}

main().catch(console.error).finally(() => prisma.$disconnect());
