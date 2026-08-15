import { NextResponse } from 'next/server';
import { loadSoulFile, writeSoulFile } from '@/lib/memory-engine';

/**
 * GET — Read an agent's soul file
 */
export async function GET(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const content = await loadSoulFile(agentId);
    return NextResponse.json({ agentId, content, exists: content.length > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT — Update an agent's soul file (manual edit or Dreaming Agent)
 * Body: { content }
 */
export async function PUT(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const { content } = await req.json();

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    await writeSoulFile(agentId, content);
    return NextResponse.json({ ok: true, agentId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
