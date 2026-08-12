import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting mock CRM leads...');

  // Lead 1: High Intent Student (Admissions AI)
  const lead1 = await prisma.customer.create({
    data: {
      name: '张宇轩家长 (Wang)',
      type: 'PARENT',
      phone: '138-0013-8000',
      email: 'wang_parent@example.com',
      intent: 'A-Level 申请',
      source: '院校数字分身 (Official AI)',
      notes: '需要寄宿，预算充足，对足球感兴趣。',
      background: JSON.stringify({
        studentAge: 15,
        targetYear: 2025,
        targetProgram: 'A-Level',
        currentSchool: '上海平和双语',
        budget: '5万英镑/年',
        interests: ['Football', 'Physics', 'Robotics']
      }),
      insights: '该家庭属于典型的高净值留学家庭。孩子理科基础较好，但英语口语稍显薄弱。家长非常看重学校的安全管理和寄宿条件。对我们的户外拓展课程（尤其是足球学院）表现出极高兴趣，有强烈入读意向。',
      nextSteps: '1. 发送足球学院的详细介绍PDF手册。\n2. 安排一次由招生官主导的 1v1 视频面试，重点评估英语水平。\n3. 邀请参加下个月在上海举办的线下家长见面会。',
      sourceAI: 'admissions_ai',
      interactions: {
        create: {
          type: 'AI_CHAT',
          summary: '家长咨询了A-Level课程设置、寄宿条件以及足球特长生的选拔标准，并在对话末尾主动留下了联系方式。',
          messages: JSON.stringify([
            { role: 'user', content: '您好，我儿子目前在上海读初三，想了解一下你们学校的A-Level项目，主要是理科方向。', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { role: 'assistant', content: '您好！Myddelton 拥有非常出色的理科 A-Level 课程，包括进阶数学、物理和计算机科学，并配备了先进的 STEM 实验室。请问孩子平时有什么特长或爱好吗？', timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString() },
            { role: 'user', content: '他特别喜欢踢足球，你们学校有相关的训练吗？另外寄宿条件怎么样？我们比较担心安全。', timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() },
            { role: 'assistant', content: '那太巧了！我们拥有顶尖的足球学院，并与专业俱乐部合作。寄宿方面，我们提供全寄宿，24小时有经验丰富的舍监全天候照顾，非常安全。您希望我将详细的手册和学费信息发给您吗？', timestamp: new Date(Date.now() - 3600000 * 1.7).toISOString() },
            { role: 'user', content: '好的，我的电话是138-0013-8000，邮箱 wang_parent@example.com，麻烦发我一份。', timestamp: new Date(Date.now() - 3600000 * 1.6).toISOString() },
            { role: 'assistant', content: '已经为您记录并安排发送。我们的招生团队很快会与您取得联系，为您提供专属的 1v1 咨询服务。期待在 Myddelton 见到您和您的孩子！', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() }
          ])
        }
      }
    }
  });

  // Lead 2: Partner Agency
  const lead2 = await prisma.customer.create({
    data: {
      name: '李总 (EduLink Education)',
      type: 'PARTNER',
      phone: '139-5555-6666',
      email: 'li@edulink.example.com',
      intent: '批量送生协议',
      source: '独立顾问 AI (Agency Studio)',
      notes: '一家深圳的中型留学中介。',
      background: JSON.stringify({
        companySize: '20-50 employees',
        location: 'Shenzhen',
        annualStudentVolume: 50,
        mainTargetCountry: 'UK'
      }),
      insights: '该中介主要做英国低龄留学，拥有稳定的生源，目前正在寻找新的优质寄宿学校作为主推项目。对佣金比例非常敏感，同时要求学校提供足够的市场营销物料支持。',
      nextSteps: '1. 发送标准 B2B 合作协议和佣金层级说明。\n2. 预约本周五下午的 Zoom 会议，向其顾问团队做一次系统的校园培训。\n3. 提供无水印的校园宣传视频和高清图片包。',
      sourceAI: 'agency_consultant_ai',
      interactions: {
        create: {
          type: 'AI_CHAT',
          summary: '该中介负责人咨询了学校目前的国际生比例、申请门槛以及渠道合作政策，希望获取营销资料。',
          messages: JSON.stringify([
            { role: 'user', content: '你好，我是深圳一家中介的负责人。听说你们在招代理，想问下目前的国际生尤其是中国学生比例是多少？', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
            { role: 'assistant', content: '您好李总！Myddelton 严格控制国际生比例在 30% 以内，中国学生占比极低，提供了极佳的纯正英式语言环境。请问贵司每年送英的低龄学生规模大约是多少？', timestamp: new Date(Date.now() - 86400000 * 1.9).toISOString() },
            { role: 'user', content: '大概一年50个左右吧。如果合作的话，你们的佣金政策是怎么样的？有现成的宣传册吗？', timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString() },
            { role: 'assistant', content: '对于稳定的优质渠道，我们提供非常有竞争力的阶梯佣金。我们也有完备的中文版渠道支持包，包含高清图片、视频和顾问培训资料。您可以留一下联系方式，我让渠道经理对接您。', timestamp: new Date(Date.now() - 86400000 * 1.7).toISOString() },
            { role: 'user', content: '好的，13955556666，微信同号。', timestamp: new Date(Date.now() - 86400000 * 1.6).toISOString() }
          ])
        }
      }
    }
  });

  // Lead 3: Uncertain Student
  const lead3 = await prisma.customer.create({
    data: {
      name: '陈同学',
      type: 'STUDENT',
      phone: '150-1234-9876',
      email: 'chen123@example.com',
      intent: '夏令营/体验项目',
      source: '院校数字分身 (Official AI)',
      notes: '学生本人咨询，还在观望中。',
      background: JSON.stringify({
        studentAge: 16,
        currentGrade: '高一',
        englishLevel: 'IELTS 5.5',
        interests: ['Drama', 'Art']
      }),
      insights: '这是学生本人进行的咨询。她对戏剧和艺术非常向往，但对长期留学仍有顾虑（离家远、不适应）。她的语言成绩中等，直接申请A-Level可能比较吃力。',
      nextSteps: '1. 重点推荐两周期的暑期精英夏令营（含戏剧工坊）。\n2. 将其列入长期培育列表（Nurture List），定期发送戏剧社团的活动新闻。\n3. 尝试获取其家长的联系方式以进行深入沟通。',
      sourceAI: 'admissions_ai',
      interactions: {
        create: {
          type: 'AI_CHAT',
          summary: '学生咨询了艺术课程和校园氛围，表现出对暑期短期项目的兴趣，但尚未决定长期留学。',
          messages: JSON.stringify([
            { role: 'user', content: '我想去英国念书，但我很喜欢画画和戏剧，你们学校这方面好吗？', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
            { role: 'assistant', content: '你好！我们的艺术和戏剧课程是全英领先的，有专属的表演剧场和艺术工作室。很多毕业生都去到了伦艺(UAL)等顶尖艺术学府。', timestamp: new Date(Date.now() - 86400000 * 4.9).toISOString() },
            { role: 'user', content: '听起来不错...但我有点怕跟不上，而且没怎么离开过家。', timestamp: new Date(Date.now() - 86400000 * 4.8).toISOString() },
            { role: 'assistant', content: '完全理解你的顾虑。如果你不确定，为什么不先试试我们今年夏天的“精英艺术夏令营”呢？为期两周，可以结交全世界的朋友，顺便体验一下真实的寄宿生活。', timestamp: new Date(Date.now() - 86400000 * 4.7).toISOString() },
            { role: 'user', content: '这个可以有！有资料吗？可以发我邮箱 chen123@example.com，我电话是15012349876，我得跟我爸妈商量一下。', timestamp: new Date(Date.now() - 86400000 * 4.6).toISOString() }
          ])
        }
      }
    }
  });

  console.log('Successfully inserted 3 mock CRM leads.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
