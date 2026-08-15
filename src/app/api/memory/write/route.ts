import { NextResponse } from 'next/server';
import { writeMemory } from '@/lib/memory-engine';

/**
 * POST — Write a memory entry for an agent
 * Body: { agentId, type, source, content, importance, taskId? }
 */
export async function POST(req: Request) {
  try {
    const { agentId, type, source, content, importance, taskId } = await req.json();

    if (!agentId || !content) {
      return NextResponse.json({ error: 'Missing agentId or content' }, { status: 400 });
    }

    const entry = await writeMemory(agentId, {
      type: type || 'lesson_learned',
      source: source || 'system',
      content,
      importance: importance ?? 0.5,
      taskId,
    });

    return NextResponse.json({ ok: true, entry });
  } catch (error: any) {
    console.error('Memory write error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
