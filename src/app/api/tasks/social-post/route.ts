import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 120; // 2 minutes max duration

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const SCHOOL_CONTEXT = `
学校名称：Myddelton College (迈德尔顿公学)
学校简介：位于英国北威尔士，拥有百年历史城堡校区。
核心卖点：
- 沉浸式全英文环境，真正的英式全人教育。
- 户外探索项目丰富，如马术、高尔夫、攀岩、皮划艇。
- 学术成绩优异，多名学生进入牛剑等G5名校。
- 科技赋能教育，苹果杰出教育学校（Apple Distinguished School），一人一台iPad。
`;

export async function POST(req: Request) {
  if (!process.env.DASHSCOPE_API_KEY) {
    return NextResponse.json({ error: 'DASHSCOPE_API_KEY not configured.' }, { status: 500 });
  }

  try {
    const { topic, length, language } = await req.json();

    const lengthInstruction = length === 'short' ? '短文（100-200字）' : length === 'long' ? '长文干货（500字左右）' : '中等篇幅（300字左右）';
    const langInstruction = language === 'en' ? '纯英文' : language === 'mix' ? '中文，适当夹杂高级英文词汇' : '中文';
    const topicInstruction = topic ? `核心诉求/主题：${topic}` : '话题：从“学术干货（如A-Level避坑）”、“沉浸式校园打卡（百年城堡/马术）”、“升学逆袭故事”中随机选择一种';

    const prompt = `
    作为一位拥有50万粉丝、极具网感的国际教育领域小红书运营操盘手，请为“Myddelton College (迈德尔顿公学)”生成一篇爆款小红书图文草稿。

    基础素材：
    ${SCHOOL_CONTEXT}

    要求：
    1. 【话题方向】：${topicInstruction}，视角必须吸引家长或留学生。
    2. 【语言风格】：${langInstruction}。
    3. 【篇幅】：${lengthInstruction}。
    4. 【标题】：必须带有悬念、情绪价值或数字，使用恰当的Emoji，长度不超过20字，必须抓人眼球。
    5. 【正文】：
       - 采用经典的小红书“总-分-总”排版。
       - 分段要短，每段2-3句话，多用空行。
       - 恰到好处地使用 Emoji，但不要过分堆砌。
       - 语气要真诚、带有“利他”属性（如：掏心窝子分享、建议先收藏等）。
    6. 【标签】：给出 3-5 个带有流量属性的话题标签（如 #英国私校 #低龄留学 等）。
    7. 【配图建议】：用一句详细的画面描述，教运营人员应该配一张什么样的首图，比如：“一张在古堡前穿着英式校服骑马的高清照片，阳光要好，带有复古滤镜风格”。

    输出格式：
    必须严格输出合法的 JSON，不要输出任何 markdown 标记或其他文本。结构如下：
    {
      "title": "...",
      "content": "...",
      "tags": ["...", "..."],
      "imagePrompt": "..."
    }
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(aiResponse.choices[0].message.content || '{}');

    return NextResponse.json(aiResult);
  } catch (error) {
    console.error('Social Post AI Error:', error);
    return NextResponse.json({ error: 'Failed to generate social media post.', details: String(error) }, { status: 500 });
  }
}
