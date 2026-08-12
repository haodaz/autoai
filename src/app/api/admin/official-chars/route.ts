import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { OfficialCharsConfig } from '@/lib/config/types';

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    return NextResponse.json({ ok: true, config: config.officialCharsConfig ?? {} });
  } catch {
    return NextResponse.json({ ok: true, config: {} });
  }
}

/** POST /api/admin/official-chars
 *  body: { config: { charId: {...} } }  ← 全量覆盖
 *  或    { charId, ...fields }           ← 单条 patch（merge）
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body = await req.json();

    const { config } = await getCloudConfig(token);
    let newConfig: OfficialCharsConfig;

    if (body.config && typeof body.config === 'object') {
      // 全量覆盖模式
      newConfig = body.config;
    } else {
      // 单条 patch 模式
      const { charId, ...fields } = body;
      if (!charId) return NextResponse.json({ error: 'charId required' }, { status: 400 });
      const current = config.officialCharsConfig ?? {};
      newConfig = { ...current, [charId]: { ...(current[charId] || {}), ...fields } };
    }

    await saveCloudConfig({ ...config, officialCharsConfig: newConfig }, token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
