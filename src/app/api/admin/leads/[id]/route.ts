import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { Lead } from '@/lib/config/types';

/** PATCH /api/admin/leads/:id — 仅更新 status / statusNote（管理员跟进） */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const token = await getToken(req);

    const { config } = await getCloudConfig(token);
    const leads: Lead[] = config.leads ?? [];
    const idx = leads.findIndex(l => l.id === id);
    if (idx < 0) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const { status, statusNote } = body;
    if (status) leads[idx].status = status;
    if (statusNote !== undefined) leads[idx].statusNote = statusNote;
    leads[idx].updatedAt = new Date().toISOString();

    await saveCloudConfig({ ...config, leads }, token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = await getToken(_req);

    const { config } = await getCloudConfig(token);
    const leads = (config.leads ?? []).filter(l => l.id !== id);

    await saveCloudConfig({ ...config, leads }, token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
