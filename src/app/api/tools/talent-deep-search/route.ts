import { NextResponse } from 'next/server';
import { runTalentDeepSearchStream } from '@/lib/tools/talentDeepSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, en_name, cn_name, institution } = body;
    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const stream = await runTalentDeepSearchStream(query, institution, en_name, cn_name);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error: any) {
    console.error('[TalentDeepSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
