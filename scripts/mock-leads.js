const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock leads...');

  // Clear existing if any for clean slate (optional, let's just add)
  
  // Mock Lead 1: High Intent (A-Level)
  await prisma.customer.create({
    data: {
      type: 'PARENT',
      name: '王女士',
      phone: '13800138001',
      email: 'wang@example.com',
      intent: '申请 Year 12 (A-Level)',
      background: JSON.stringify({
        age: 16,
        current_school: '国内某公立高中高一',
        budget: '50万人民币/年',
        hobbies: '网球、钢琴',
      }),
      insights: '家长意向非常强烈，孩子成绩不错，对预算不敏感。重点关注升学率和体育设施。',
      nextSteps: '建议明天上午由资深顾问回电，直接抛出米德尔顿的网球学院和罗素集团升学数据作为敲门砖。',
      sourceAI: 'agency_consultant_ai',
      interactions: {
        create: [
          {
            type: 'AI_CHAT',
            summary: '咨询了A-Level入学条件和网球设施，留下了电话。',
            messages: '{"history": "User: 你们学校有网球场吗？我想送孩子去读A-Level..."}'
          }
        ]
      }
    }
  });

  // Mock Lead 2: Medium Intent (Hesitating on budget)
  await prisma.customer.create({
    data: {
      type: 'PARENT',
      name: '李先生',
      phone: '13900139002',
      intent: '了解初中寄宿',
      background: JSON.stringify({
        age: 13,
        current_school: '双语学校',
        budget: '30万以内',
        concerns: '安全、伙食、费用',
      }),
      insights: '意向中等。预算卡得比较死，担心孩子一个人在国外的生活自理能力。',
      nextSteps: '发一封详细的寄宿生活介绍邮件，强调学校的全天候生活老师照顾，并附上费用清单（重点展示性价比）。',
      sourceAI: 'admissions_ai',
      interactions: {
        create: [
          {
            type: 'AI_CHAT',
            summary: '重点询问了住宿条件和一年总花费。',
            messages: '{"history": "User: 你们学费包食宿吗？一年30万够不够？"}'
          }
        ]
      }
    }
  });

  // Mock Lead 3: Low Intent / Junk (Just browsing / Irrelevant)
  await prisma.customer.create({
    data: {
      type: 'STUDENT',
      name: 'Tom',
      email: 'tom_cool@gmail.com',
      intent: '游学/夏令营',
      background: JSON.stringify({
        age: 10,
        purpose: '随便问问',
      }),
      insights: '意向极低。只是随便点开聊聊夏令营，目前不考虑长期留学。',
      nextSteps: '放入公海池或标记为暂缓跟进。可自动发送一份夏令营电子手册。',
      sourceAI: 'admissions_ai',
      interactions: {
        create: [
          {
            type: 'AI_CHAT',
            summary: '随便问了问夏令营。',
            messages: '{"history": "User: 你们暑假有夏令营吗？好玩吗？"}'
          }
        ]
      }
    }
  });

  console.log('Mock leads seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
