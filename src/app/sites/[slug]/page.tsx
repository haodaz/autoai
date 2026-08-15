import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

const SITES_DIR = path.join(process.cwd(), 'public', '_sites');

interface WebPage {
  id: string;
  title: string;
  html: string;
  inNav: boolean;
}

interface SiteData {
  slug: string;
  siteName: string;
  themeColor: string;
  pages: WebPage[];
}

async function loadSite(slug: string): Promise<SiteData | null> {
  try {
    const filePath = path.join(SITES_DIR, `${slug}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) return { title: 'Not Found' };
  return {
    title: site.siteName,
    description: `${site.siteName} — Powered by BEP AI`,
  };
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page: pageId } = await searchParams;

  const site = await loadSite(slug);
  if (!site || !site.pages?.length) return notFound();

  const activePage = (pageId ? site.pages.find(p => p.id === pageId) : site.pages[0]) || site.pages[0];

  const navLinks = site.pages
    .filter(p => p.inNav)
    .map(p => `<a href="/sites/${slug}?page=${p.id}" class="px-4 py-2 text-sm font-bold transition-all hover:opacity-70 ${p.id === activePage.id ? 'border-b-2' : ''}" style="border-color: ${site.themeColor}">${p.title}</a>`)
    .join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.siteName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <header class="bg-white border-b px-6 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white" style="background: ${site.themeColor}">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <span class="font-bold text-xl">${site.siteName}</span>
    </div>
    <nav class="hidden md:flex gap-2">
      ${navLinks}
    </nav>
  </header>
  <main>
    ${activePage.html}
  </main>
  <footer class="bg-gray-50 py-12 px-8 border-t">
    <div class="max-w-4xl mx-auto text-center opacity-50 text-sm">
      &copy; ${new Date().getFullYear()} ${site.siteName}. Powered by BEP AI
    </div>
  </footer>
</body>
</html>`;

  return (
    <html>
      <body>
        <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
      </body>
    </html>
  );
}
