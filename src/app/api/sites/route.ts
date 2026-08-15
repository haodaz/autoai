import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SITES_DIR = path.join(process.cwd(), 'public', '_sites');

async function ensureDir() {
  try { await fs.mkdir(SITES_DIR, { recursive: true }); } catch {}
}

/**
 * POST — Save a site
 * Body: { slug, siteName, themeColor, pages: WebPage[] }
 */
export async function POST(req: Request) {
  try {
    const { slug, siteName, themeColor, pages } = await req.json();
    if (!slug || !pages) {
      return NextResponse.json({ error: 'Missing slug or pages' }, { status: 400 });
    }

    // Sanitize slug
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    await ensureDir();
    const filePath = path.join(SITES_DIR, `${safeSlug}.json`);
    await fs.writeFile(filePath, JSON.stringify({
      slug: safeSlug,
      siteName,
      themeColor,
      pages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, url: `/sites/${safeSlug}` });
  } catch (error: any) {
    console.error('Save site error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET — List all saved sites
 */
export async function GET() {
  try {
    await ensureDir();
    const files = await fs.readdir(SITES_DIR);
    const sites = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(SITES_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        sites.push({
          slug: data.slug,
          siteName: data.siteName,
          pageCount: data.pages?.length || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } catch {}
    }
    return NextResponse.json(sites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
