import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/tools/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    const query = `${name} site:en.wikipedia.org OR site:baike.baidu.com OR site:zh.wikipedia.org`;
    const results = await searchWeb(query);

    return NextResponse.json({ ok: true, data: results });
  } catch (error: any) {
    console.error('[WikiBaikeSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
