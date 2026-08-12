import { NextRequest, NextResponse } from 'next/server';
import { characterManager } from '@/lib/ai/characters';

export const dynamic = 'force-dynamic';

/** GET /api/admin/characters — list all local characters */
export async function GET() {
  try {
    const chars = await characterManager.getAllCharacters();
    return NextResponse.json(chars);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/admin/characters — create a new character */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newId = await characterManager.saveCharacter(body);
    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
