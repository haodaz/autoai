import { NextResponse } from 'next/server';
import { searchOrcid, getOrcidWorks } from '@/lib/tools/orcid_funcs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { name, orcid_id } = await request.json();

    if (orcid_id) {
      // Direct lookup by ORCID ID
      const works = await getOrcidWorks(orcid_id);
      return NextResponse.json({ ok: true, data: { orcid_id, works } });
    }

    if (!name) return NextResponse.json({ error: 'Missing name or orcid_id' }, { status: 400 });

    const results = await searchOrcid(name);
    return NextResponse.json({ ok: true, data: results });
  } catch (error: any) {
    console.error('[OrcidSearch] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
