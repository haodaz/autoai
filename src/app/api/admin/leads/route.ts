import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { Lead } from '@/lib/config/types';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    const leads = config.leads ?? [];
    const status = req.nextUrl.searchParams.get('status');
    const filtered = status ? leads.filter(l => l.status === status) : leads;
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body = await req.json();

    const { config } = await getCloudConfig(token);
    const leads: Lead[] = config.leads ?? [];

    // Upsert by sourceConvId
    const convId = body.sourceConvId || body.convId;
    const existIdx = convId ? leads.findIndex(l => l.sourceConvId === convId) : -1;
    if (existIdx >= 0) {
      const old = leads[existIdx];
      const merged: Lead = {
        ...old,
        name:    (body.name  && body.name  !== '(unknown)') ? body.name  : old.name,
        phone:   (body.phone && body.phone !== '(unknown)') ? body.phone : old.phone,
        wechat:  (body.wechat&& body.wechat!== '(unknown)') ? body.wechat: old.wechat,
        resourceTypes: [...new Set([...(old.resourceTypes||[]), ...(body.resourceTypes||[])])],
        conversationSummary: body.conversationSummary || old.conversationSummary,
        aiAssessment:        body.aiAssessment        || old.aiAssessment,
        updatedAt: new Date().toISOString(),
      };
      leads[existIdx] = merged;
      await saveCloudConfig({ ...config, leads }, token);
      return NextResponse.json({ ok: true, id: merged.id, action: 'updated' });
    }

    const lead: Lead = {
      id:        `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status:    'pending',
      statusNote:          '',
      sourceCharId:        body.sourceCharId   || '',
      sourceCharName:      body.sourceCharName || '',
      sourceConvId:        body.sourceConvId   || '',
      name:                body.name           || '',
      phone:               body.phone          || '',
      wechat:              body.wechat         || '',
      grade:               body.grade          || '',
      education:           body.education      || '',
      province:            body.province       || '',
      resourceTypes:       body.resourceTypes  || [],
      conversationSummary: body.conversationSummary || '',
      aiAssessment:        body.aiAssessment   || '',
      notes:               body.notes          || '',
    };
    leads.unshift(lead);
    await saveCloudConfig({ ...config, leads }, token);
    return NextResponse.json({ ok: true, id: lead.id, action: 'created' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
