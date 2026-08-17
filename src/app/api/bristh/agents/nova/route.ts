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

    const fallbackPersona = 'You are Nova, the Policy Intelligence Specialist at 平方创想教育科技. You search and analyze talent policies from 平方数据平台 and the internet to provide structured policy reports with eligibility assessments.';

    // 1. Call policy search tool
    let toolResult = '';
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:6660';

      const searchRes = await fetch(`${baseUrl}/api/tools/policy-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: task.instruction }),
      });

      if (searchRes.ok && searchRes.body) {
        const reader = searchRes.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'ai_chunk') toolResult += data.data;
                  if (data.type === 'raw_data') toolResult += '\n\n[原始数据]\n' + JSON.stringify(data.data).slice(0, 2000);
                } catch {}
              }
            }
          }
        }
      }
    } catch (toolErr: any) {
      toolResult = `[工具调用失败: ${toolErr.message}]`;
    }

    // 2. Generate final policy report
    const systemPrompt = await buildAgentPrompt('nova', task.instruction, task.context.rawContent, fallbackPersona, locale)
      + '\n\n## 工具检索结果\n' + (toolResult || '暂无检索结果')
      + '\n\n请基于以上检索数据，生成结构化政策分析报告（Markdown格式）。包含：政策速览表、详细解读、适用人群分析、操作建议。';

    const { client, config } = await getModelClient();
    const response = await client.chat.completions.create(
      buildCompletionParams(config, [{ role: 'system', content: systemPrompt }])
    );

    const resultMarkdown = response.choices[0].message.content || '政策检索未返回结果。';

    const summaryMatch = resultMarkdown.match(/^#+ (.+)/m);
    const summary = summaryMatch ? summaryMatch[1].slice(0, 80) : resultMarkdown.slice(0, 80).replace(/[#*]/g, '').trim();

    const resultPayload = JSON.stringify({
      summary: `📜 ${summary}`,
      content: resultMarkdown
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: task.requiresApproval ? 'AWAITING_APPROVAL' : 'COMPLETED',
        resultPayload
      }
    });

    recordTaskCompletion('nova', taskId, task.instruction, resultMarkdown.slice(0, 200)).catch(() => {});

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Nova agent error:', error);
    if (taskIdForError) {
      await prisma.task.update({
        where: { id: taskIdForError },
        data: { status: 'FAILED' }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
