import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

export async function POST(req: Request) {
  try {
    const { comments } = await req.json();

    if (!comments || comments.length === 0) {
      return NextResponse.json({ error: 'No comments provided' }, { status: 400 });
    }

    const createdLeads = [];

    for (const comment of comments) {
      const prompt = `
      请分析以下这条来自小红书家长的评论，提取线索信息。
      评论内容：“${comment}”

      要求输出为 JSON：
      {
        "name": "随机生成一个微信/小红书网名 (如: 冰糖葫芦, 阳光妈妈)",
        "intent": "简短的一句话描述客户核心意向 (如: 咨询学费, 关注录取要求)",
        "background": {
           // 根据评论提取出的背景信息键值对，如果没有则留空
        },
        "insights": "简短分析该家长的痛点或关注点，以及转化可能性",
        "nextSteps": "下一步如何私信跟进的建议"
      }
      `;

      const aiResponse = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const aiResult = JSON.parse(aiResponse.choices[0].message.content || '{}');

      // 存入数据库
      const lead = await prisma.customer.create({
        data: {
          name: aiResult.name || '小红书访客',
          type: 'STUDENT',
          intent: aiResult.intent || '未知意向',
          source: '小红书引流',
          background: JSON.stringify(aiResult.background || {}),
          insights: aiResult.insights || '',
          nextSteps: aiResult.nextSteps || '',
          sourceAI: 'social_assistant',
          interactions: {
            create: {
              type: 'SOCIAL',
              summary: '从小红书爆款文案下自动抓取的留言线索。',
              messages: JSON.stringify([{ role: 'user', content: comment, timestamp: new Date().toISOString() }])
            }
          }
        }
      });
      createdLeads.push(lead);
    }

    return NextResponse.json({ success: true, count: createdLeads.length });

  } catch (error) {
    console.error('Social Leads parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse leads', details: String(error) }, { status: 500 });
  }
}
