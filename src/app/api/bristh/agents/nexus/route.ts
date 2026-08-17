import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import { buildAgentPrompt } from '@/lib/bristh-config';
import { recordTaskCompletion } from '@/lib/memory-hooks';

export async function POST(req: Request) {
  let taskIdForError = '';
  try {
    const { taskId, locale } = await req.json();
    taskIdForError = taskId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { context: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'RUNNING' }
    });

    const fallbackPersona = `You are Nexus, the Industry-Research Transfer Specialist at 平方创想教育科技. You bridge academia and industry by analyzing research directions for industrial landing opportunities and recommending matching R&D teams for enterprise needs. You produce structured reports with multi-dimensional scoring.`;

    // Call talent search and policy search tools in parallel to gather context
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:6660';

    let talentData = '';
    let policyData = '';

    // Extract search keywords from instruction
    const instruction = task.instruction;

    // Call talent deep search (extract person/field keywords)
    try {
      const talentRes = await fetch(`${baseUrl}/api/tools/talent-deep-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: instruction.slice(0, 50) }),
      });
      if (talentRes.ok && talentRes.body) {
        const reader = talentRes.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'ai_chunk') talentData += data.data;
                } catch {}
              }
            }
          }
        }
      }
    } catch (e) {
      talentData = '[人才检索暂时不可用]';
    }

    // Call policy search
    try {
      const policyRes = await fetch(`${baseUrl}/api/tools/policy-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: instruction.slice(0, 50), region: '', background: '' }),
      });
      if (policyRes.ok && policyRes.body) {
        const reader = policyRes.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'ai_chunk') policyData += data.data;
                } catch {}
              }
            }
          }
        }
      }
    } catch (e) {
      policyData = '[政策检索暂时不可用]';
    }

    const toolContext = `
## 人才与科研数据（来自Jarvis人才检索引擎）
${talentData || '暂无人才检索结果'}

## 政策数据（来自Nova政策检索引擎）
${policyData || '暂无政策检索结果'}
`;

    const systemPrompt = await buildAgentPrompt('nexus', instruction, task.context.rawContent, fallbackPersona, locale)
      + '\n\n## 工具检索结果（请引用这些真实数据支撑你的分析）\n' + toolContext
      + '\n\n请基于用户需求和以上数据，生成结构化的产研转化分析报告（Markdown格式）。'
      + '\n\n报告必须包含：综合分析摘要（≥300字）、四维评分分析、推荐方向/匹配项、可操作建议、合作路线图、下一步行动。';

    const { client, config } = await getModelClient();
    const response = await client.chat.completions.create(
      buildCompletionParams(config, [{ role: 'system', content: systemPrompt }])
    );

    const resultMarkdown = response.choices[0].message.content || '产研转化分析未返回结果。';

    const summaryMatch = resultMarkdown.match(/^#+ (.+)/m);
    const summary = summaryMatch ? summaryMatch[1].slice(0, 80) : resultMarkdown.slice(0, 80).replace(/[#*]/g, '').trim();

    const resultPayload = JSON.stringify({
      summary: `🔗 ${summary}`,
      content: resultMarkdown
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: task.requiresApproval ? 'AWAITING_APPROVAL' : 'COMPLETED',
        resultPayload
      }
    });

    recordTaskCompletion('nexus', taskId, instruction, resultMarkdown.slice(0, 200)).catch(() => {});

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Nexus agent error:', error);
    if (taskIdForError) {
      await prisma.task.update({
        where: { id: taskIdForError },
        data: { status: 'FAILED' }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
