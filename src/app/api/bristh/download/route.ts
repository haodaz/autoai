import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/bristh/download?file=xxx.pptx
 * Serves generated files from /tmp/bristh-downloads/
 * This is needed because deployed environments have read-only public/ dirs.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  // Sanitize: only allow alphanumeric, dash, underscore, dot
  const sanitized = path.basename(fileName);
  const filePath = path.join('/tmp', 'bristh-downloads', sanitized);

  try {
    const buffer = await fs.readFile(filePath);
    
    const ext = path.extname(sanitized).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ics': 'text/calendar',
    };

    return new Response(buffer, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${sanitized}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
