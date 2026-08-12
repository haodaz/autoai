import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const SCHOOL_INFO = `
学校：Myddelton College (迈德尔顿公学)
- 英国北威尔士百年历史寄宿学校
- 强调学术与全人教育结合 (马术、高尔夫、户外探索)
- 微软/苹果杰出教育学校
- 提供 Year 7 - 13 (初一至高三) 及 A-Level 课程
- 国际生学费大约 35,000 - 45,000 英镑/年 (具体根据年级而定)
- 雅思要求：通常高中需 UKVI IELTS 5.0 - 5.5，若语言不足可配语言班。
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, insights, nextSteps, language } = body;

    const history = (messages || []).map((m: any) => `${m.role === 'user' ? '客户' : '我们'}: ${m.content}`).join('\n');

    const prompt = `
    你现在是英国 Myddelton College 的高级招生官。请根据以下客户的咨询历史和 AI 的背调建议，撰写一封专业、热情、能够促进转化（如安排线上面试或进一步咨询）的回复邮件。

    【学校基础资料】
    ${SCHOOL_INFO}

    【客户咨询历史】
    ${history}

    【AI 客户画像洞察】
    ${insights || '无'}

    【建议的下一步动作】
    ${nextSteps || '无'}

    【要求】
    1. 语言：必须使用 ${language === 'EN' ? '英文' : '中文'} 撰写。
    2. 语气：专业但温暖，体现英国私校的关怀（Pastoral Care）精神。如果有对脾气、心理的担忧，请给予安抚并强调学校的关怀体系。
    3. 结构：
       - 感谢对方的来信。
       - 针对性地回答对方的疑问（如学费区间、雅思要求）。
       - 结合 AI 的洞察和建议动作，推动下一步（如邀请虚拟访校、安排线上会议）。
       - 落款为 "Admissions Team, Myddelton College"。
    4. 格式：不要包含 "Subject:" 或任何 markdown 代码块标记，直接输出邮件正文。空行使用普通换行。
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [{ role: "user", content: prompt }],
    });

    const draft = aiResponse.choices[0].message.content || '';

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Draft Generate Error:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
