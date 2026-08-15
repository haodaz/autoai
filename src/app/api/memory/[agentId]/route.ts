import { NextResponse } from 'next/server';
import { loadAgentMemories, getAgentMemoryStats, loadTaskMemories, deleteMemory } from '@/lib/memory-engine';

/**
 * GET — Read memories for a specific agent
 * Query: ?type=all|task|stats
 */
export async function GET(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all';

    if (type === 'stats') {
      const stats = await getAgentMemoryStats(agentId);
      return NextResponse.json(stats);
    }

    if (type === 'task') {
      const tasks = await loadTaskMemories(agentId);
      return NextResponse.json(tasks);
    }

    // Default: all memories
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const memories = await loadAgentMemories(agentId, limit);
    return NextResponse.json(memories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE — Remove a specific memory entry
 * Body: { memoryId }
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const { memoryId } = await req.json();

    if (!memoryId) {
      return NextResponse.json({ error: 'Missing memoryId' }, { status: 400 });
    }

    const deleted = await deleteMemory(agentId, memoryId);
    return NextResponse.json({ ok: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
