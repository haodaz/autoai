const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { name: 'Zhuang Hao' }
  });

  if (customer) {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tomorrow
    today.setHours(14, 0, 0, 0); // 14:00

    const endTime = new Date(today.getTime() + 30 * 60000); // 14:30

    await prisma.meeting.create({
      data: {
        customerId: customer.id,
        subject: 'Admissions Interview - Zhuang Hao',
        startTime: today,
        endTime: endTime,
        location: 'Zoom Meeting',
        description: 'Thank you for your interest in Myddelton College. We look forward to our interview.',
        status: 'SCHEDULED'
      }
    });

    console.log('Successfully inserted mock meeting for Zhuang Hao.');
  } else {
    console.log('Customer Zhuang Hao not found. Cannot insert mock meeting.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
