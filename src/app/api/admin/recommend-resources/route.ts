import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { RecommendResources } from '@/lib/config/types';

const EMPTY: RecommendResources = { pages: [], apps: [] };

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    return NextResponse.json(config.recommendResources ?? EMPTY);
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body: RecommendResources = await req.json();

    const { config } = await getCloudConfig(token);
    await saveCloudConfig({ ...config, recommendResources: body }, token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
