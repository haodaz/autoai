import prisma from '@/lib/prisma';

const dashscopeKey = process.env.DASHSCOPE_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

export async function POST(req: Request) {
  if (!dashscopeKey && !anthropicKey) {
    return new Response(
      JSON.stringify({ error: 'Missing API Keys' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Fetch recent leads from database
    const leads = await prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (leads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No leads found to analyze.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Prepare the prompt for the AI to analyze them in batch
    const leadsData = leads.map(l => ({
      name: l.name,
      intent: l.intent,
      background: l.background,
      insights: l.insights,
      nextSteps: l.nextSteps,
      source: l.sourceAI
    }));

    const systemPrompt = `你是一个资深的国际教育招生总监。你需要对以下刚刚收集到的几条客户线索进行批量意向打分与体检总结。
请严格输出一个 JSON 格式的结果，不要包含任何额外的 markdown 格式或者废话。
JSON 结构如下：
{
  "summary": "你对今天整体线索质量的概括点评（1句话）",
  "results": [
    {
      "name": "客户名字",
      "score": "A / B / C",
      "reason": "为什么给这个打分（1句话）",
      "action": "下一步建议动作"
    }
  ]
}

以下是今天的线索列表：
${JSON.stringify(leadsData, null, 2)}`;

    // 3. Call DashScope or Anthropic to perform the analysis
    let aiResponseText = '';

    if (dashscopeKey) {
      const model = process.env.DEEPSEEK_MODEL || 'qwen-plus';
      const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashscopeKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error('AI API Error');
      }
      const data = await response.json();
      aiResponseText = data.choices[0].message.content;
    } else {
      // Fallback to Anthropic if no dashscope
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 1024,
          system: 'You must output valid JSON only, without any markdown formatting.',
          messages: [{ role: 'user', content: systemPrompt }],
        }),
      });
      if (!response.ok) throw new Error('Anthropic API Error');
      const data = await response.json();
      aiResponseText = data.content[0].text;
    }

    // 4. Parse JSON
    let analysisResult;
    try {
      // Strip markdown code blocks if the AI accidentally added them
      const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
      analysisResult = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponseText);
      throw new Error('AI 返回的格式不正确');
    }

    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Task API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
