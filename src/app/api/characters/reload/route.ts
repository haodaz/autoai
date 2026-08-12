import { NextResponse } from 'next/server';
import { characterManager } from '@/lib/ai/characters';

/** POST /api/characters/reload — invalidate character cache */
export async function POST() {
  characterManager.reload();
  return NextResponse.json({ ok: true });
}
