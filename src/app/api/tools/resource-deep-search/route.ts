import { NextResponse } from 'next/server';
import { runResourceDeepSearchStream } from '@/lib/tools/resourceDeepSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, resourceType, brandFilter } = body;
    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const token = process.env.VISIONSQUARE_AUTH_BEARER;
    const stream = await runResourceDeepSearchStream(query, resourceType, brandFilter, token);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('[ResourceDeepSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
