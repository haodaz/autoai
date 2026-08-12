import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

/** GET /api/characters/[id]/assets — list asset files */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assetsDir = path.join(CHARS_DIR, id, 'assets');

  if (!fs.existsSync(assetsDir)) return NextResponse.json([]);

  const files = fs.readdirSync(assetsDir)
    .filter(f => !f.startsWith('.') && /\.(png|jpe?g|gif|webp|svg)$/i.test(f));

  const assets = files.map(f => {
    const stat = fs.statSync(path.join(assetsDir, f));
    return {
      name: f.split('.')[0],         // stem without extension
      filename: f,
      url: `/characters/${id}/assets/${f}`,
      size: stat.size,
    };
  });

  return NextResponse.json(assets);
}

/** POST /api/characters/[id]/assets — upload asset file */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assetsDir = path.join(CHARS_DIR, id, 'assets');

  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(assetsDir, file.name);
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({
    ok: true,
    name: file.name.split('.')[0],
    url: `/characters/${id}/assets/${file.name}`,
    size: buffer.length,
  });
}
