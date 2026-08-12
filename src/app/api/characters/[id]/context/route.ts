import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

/** GET /api/characters/[id]/context — list context documents */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextDir = path.join(CHARS_DIR, id, 'context');

  if (!fs.existsSync(contextDir)) return NextResponse.json([]);

  const files = fs.readdirSync(contextDir)
    .filter(f => !f.startsWith('.'));

  const docs = files.map((f, i) => {
    const stat = fs.statSync(path.join(contextDir, f));
    return {
      id: i + 1,            // simple numeric id for delete API
      name: f,
      url: `/characters/${id}/context/${f}`,
      size: stat.size,
    };
  });

  return NextResponse.json(docs);
}

/** POST /api/characters/[id]/context — upload context document */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contextDir = path.join(CHARS_DIR, id, 'context');

  if (!fs.existsSync(contextDir)) fs.mkdirSync(contextDir, { recursive: true });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(contextDir, file.name);
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({
    ok: true,
    name: file.name,
    url: `/characters/${id}/context/${file.name}`,
    size: buffer.length,
  });
}
