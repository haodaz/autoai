import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { HomeConfig } from '@/lib/config/types';

const EMPTY: HomeConfig = {
  web: { banners: [], recommendedIds: [], themes: [], themeOrder: [] },
  h5: { banners: [], recommendedIds: [], themes: [], themeOrder: [], broadcastRoomIds: [] },
  recommendedIds: [],
};

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    return NextResponse.json(config.home_config ?? EMPTY);
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body = await req.json();

    const { config } = await getCloudConfig(token);
    const current = config.home_config ?? EMPTY;
    const merged = { ...current, ...body };
    await saveCloudConfig({ ...config, home_config: merged }, token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
