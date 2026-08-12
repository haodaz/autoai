import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const content = `Bristh Enrollment Partners 工作室业务说明：
一般来说英国中学招生的 In-country team (驻地团队) 差旅成本极高，如果由单一学校直接雇佣招生团队，成本过于昂贵且不经济。
因此，Bristh Enrollment Partners 工作室推出了“共享招生服务”。
工作室可以一次性与多家英国独立学校进行合作签约，作为他们在国内的共享代表。
在另一侧，工作室不直接对应学生或家长（To C），而是专门与国内的各类留学中介机构打交道。
业务模式总结：左右两端皆为 B 端（B2B 模式），左牵英国中学，右连国内中介机构。`;

  const record = await prisma.taskContext.create({
    data: {
      source: 'FILE',
      rawContent: content,
      parsedData: JSON.stringify({ type: 'Company_Profile', entity: 'Bristh Enrollment Partners' })
    }
  });

  console.log('Seeded knowledge base with ID:', record.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
