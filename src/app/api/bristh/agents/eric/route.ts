import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import { buildAgentPrompt, getTaskAttachments } from '@/lib/bristh-config';


export async function POST(req: Request) {
  let taskIdForError = '';
  try {
    const { taskId, locale, priorPhaseResults } = await req.json();
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

    const taskAttachments = getTaskAttachments(task.context.attachments, task.attachmentIds);
    const fallbackPersona = 'You are Eric, the Legal and Compliance Officer at 平方创想教育科技. Draft legal documents based on business agreements.';
    
    const systemPrompt = await buildAgentPrompt('eric', task.instruction, task.context.rawContent, fallbackPersona, locale, taskAttachments, priorPhaseResults)
      + '\n\nDraft a legal document (Service Agreement, NDA, MOU, or Partnership Contract) using standard legal language. Extract variables from context. Use placeholders like [INSERT FEE AMOUNT HERE] for missing info. Format as a formal contract in Markdown with numbered clauses and signature blocks. Output ONLY raw Markdown.';

    const { client, config } = await getModelClient();
    const response = await client.chat.completions.create(
      buildCompletionParams(config, [{ role: 'system', content: systemPrompt }])
    );

    const resultMarkdown = response.choices[0].message.content || 'Failed to generate contract draft.';

    const summaryMatch = resultMarkdown.match(/^#+ (.+)/m);
    const summary = summaryMatch ? summaryMatch[1].slice(0, 80) : resultMarkdown.slice(0, 80).replace(/[#*]/g, '').trim();

    const resultPayload = JSON.stringify({
      summary: `⚖️ ${summary}`,
      content: resultMarkdown
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: task.requiresApproval ? 'AWAITING_APPROVAL' : 'COMPLETED',
        resultPayload
      }
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Eric agent error:', error);
    if (taskIdForError) {
      await prisma.task.update({
        where: { id: taskIdForError },
        data: { status: 'FAILED' }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
