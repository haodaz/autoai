import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { AppCenterConfig } from '@/lib/config/types';

const EMPTY: AppCenterConfig = {
  banners: { web: [], h5: [] },
  hiddenAppIds: [],
  customApps: [],
};

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    return NextResponse.json(config.app_center_config ?? EMPTY);
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body: AppCenterConfig = await req.json();

    const { config } = await getCloudConfig(token);
    const current = config.app_center_config ?? EMPTY;
    const merged: AppCenterConfig = {
      banners: body.banners ?? current.banners,
      hiddenAppIds: body.hiddenAppIds ?? current.hiddenAppIds,
      customApps: body.customApps ?? current.customApps,
      appDetails: body.appDetails ?? current.appDetails,
    };
    await saveCloudConfig({ ...config, app_center_config: merged }, token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
