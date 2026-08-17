import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/tools/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const results = await searchWeb(query);

    return NextResponse.json({ ok: true, data: results });
  } catch (error: any) {
    console.error('[TargetedSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
