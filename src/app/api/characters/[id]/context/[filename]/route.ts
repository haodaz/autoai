import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

/** DELETE /api/characters/[id]/context/[filename] — delete context document */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const contextDir = path.join(CHARS_DIR, id, 'context');

  // filename param could be numeric id or actual filename
  const files = fs.existsSync(contextDir) ? fs.readdirSync(contextDir).filter(f => !f.startsWith('.')) : [];

  let target: string | undefined;

  // Try numeric id first (1-indexed)
  const numId = parseInt(filename, 10);
  if (!isNaN(numId) && numId > 0 && numId <= files.length) {
    target = files[numId - 1];
  }

  // Otherwise try exact filename match
  if (!target) {
    target = files.find(f => f === filename || f === decodeURIComponent(filename));
  }

  if (!target) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  fs.unlinkSync(path.join(contextDir, target));
  return NextResponse.json({ ok: true });
}
