import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.IMAP_USER,
    pass: process.env.IMAP_PASSWORD,
  }
});

async function run() {
  try {
    await transporter.sendMail({
      from: `"Boss" <${process.env.IMAP_USER}>`,
      to: process.env.IMAP_USER, // Send to self so daemon picks it up
      replyTo: 'haoz214@gmail.com',
      subject: '紧急任务：合作方案起草与回复',
      text: `Bristh 团队你好，
请立即为我们下周要拜访的潜在合作方“新东方前途出国”起草一份合作方案。

1. 请分析国内高端中介的市场现状，并撰写一份重点突出我们在英国私立中学资源优势的《联合招生商业企划书》。
2. 基于这份企划书的核心亮点，制作一份精炼的、适合当面宣讲的 5 页商业演示 PPT。
3. 务必在上述方案和 PPT 都准备完毕后，自动起草一封正式的交付邮件发给我的私人邮箱（haoz214@gmail.com），告诉我任务已经完成。`
    });
    console.log("✅ Test email sent to trigger daemon!");
  } catch(e) {
    console.error(e);
  }
}
run();
