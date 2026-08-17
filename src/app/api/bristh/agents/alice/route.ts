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

    // 1. Update status to RUNNING
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'RUNNING' }
    });

    // 2. Build prompt from config (persona from config.json + private context files)
    const fallbackPersona = 'You are Alice, the Proposal Architect at 平方创想教育科技. Generate professional business proposals in Markdown format with clear headings: Background, Proposed Solution, Timeline, and Investment.';
    
    const systemPrompt = await buildAgentPrompt('alice', task.instruction, task.context.rawContent, fallbackPersona, locale)
      + '\n\nBased on this context, generate a highly professional, persuasive business proposal or solution architecture document (in Markdown format). Just output the raw Markdown content.';

    const { client, config } = await getModelClient();
    const response = await client.chat.completions.create(
      buildCompletionParams(config, [{ role: 'system', content: systemPrompt }])
    );

    const resultMarkdown = response.choices[0].message.content || 'Failed to generate proposal.';

    // Extract first heading or first 30 chars as summary
    const summaryMatch = resultMarkdown.match(/^#+ (.+)/m);
    const summary = summaryMatch ? summaryMatch[1].slice(0, 80) : resultMarkdown.slice(0, 80).replace(/[#*]/g, '').trim();

    const resultPayload = JSON.stringify({
      summary: `📋 ${summary}`,
      content: resultMarkdown
    });

    // 3. Save output payload and mark as COMPLETED
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: task.requiresApproval ? 'AWAITING_APPROVAL' : 'COMPLETED',
        resultPayload
      }
    });

    // Memory hook: record task completion (fire-and-forget)
    recordTaskCompletion('alice', taskId, task.instruction, resultMarkdown.slice(0, 200)).catch(() => {});

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Alice agent error:', error);
    if (taskIdForError) {
      await prisma.task.update({
        where: { id: taskIdForError },
        data: { status: 'FAILED' }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
