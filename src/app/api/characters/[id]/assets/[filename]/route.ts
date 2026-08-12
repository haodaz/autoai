import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

/** DELETE /api/characters/[id]/assets/[filename] — delete asset file */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const assetsDir = path.join(CHARS_DIR, id, 'assets');

  // Find file matching the stem (filename param may not have extension)
  const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const match = files.find(f => f.split('.')[0] === filename || f === filename);

  if (!match) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  fs.unlinkSync(path.join(assetsDir, match));
  return NextResponse.json({ ok: true });
}
