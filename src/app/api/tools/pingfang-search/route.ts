import { NextResponse } from 'next/server';
import { mcpToolsDataPlatform } from '@/lib/mcp/generated-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { keyword, limit = 10 } = await request.json();
    if (!keyword) return NextResponse.json({ error: 'Missing keyword' }, { status: 400 });

    const token = process.env.VISIONSQUARE_AUTH_BEARER;
    const results = await mcpToolsDataPlatform.CRMTalentPersonFuzzySearch(keyword, parseInt(limit), token);

    return NextResponse.json({ ok: true, data: results });
  } catch (error: any) {
    console.error('[PingfangSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
