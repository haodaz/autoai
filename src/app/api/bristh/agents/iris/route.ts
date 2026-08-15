import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import { buildAgentPrompt } from '@/lib/bristh-config';
import fs from 'fs/promises';
import path from 'path';

// Allow up to 120s for webpage generation (large HTML output)
export const maxDuration = 120;

/**
 * Robust JSON extraction
 */
function extractJSON(raw: string): any {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  return null;
}

/**
 * Auto-publish site to /sites/slug
 */
async function publishSite(site: any): Promise<string> {
  const SITES_DIR = path.join(process.cwd(), 'public', '_sites');
  try { await fs.mkdir(SITES_DIR, { recursive: true }); } catch {}
  
  const slug = (site.name || 'site')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'site-' + Date.now();

  await fs.writeFile(
    path.join(SITES_DIR, `${slug}.json`),
    JSON.stringify({
      slug,
      siteName: site.name,
      themeColor: site.themeColor,
      pages: site.pages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, null, 2),
    'utf-8'
  );

  return `/sites/${slug}`;
}

export async function POST(req: Request) {
  let taskIdForError = '';
  try {
    const { taskId, locale } = await req.json();
    taskIdForError = taskId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { context: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 1. Update status to RUNNING
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'RUNNING' }
    });

    // 2. Build prompt
    const fallbackPersona = 'You are Iris, the Web Designer at Bristh Enrollment Partners. You create stunning marketing landing pages using Tailwind CSS.';
    
    const systemPrompt = await buildAgentPrompt('iris', task.instruction, task.context.rawContent, fallbackPersona, locale)
      + `\n\nBased on this context, generate a complete multi-page marketing website as a JSON object.

CRITICAL REQUIREMENTS:
1. All HTML must use Tailwind CSS classes (loaded via CDN)
2. Include image placeholders with data-image-placeholder attribute:
   <div class="relative group cursor-pointer" data-image-placeholder="true">
     <div class="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center" style="height:240px">
       <div class="text-center"><div class="text-4xl mb-2">📷</div><div class="text-sm text-gray-500">点击替换图片</div></div>
     </div>
   </div>
3. Make it mobile-responsive
4. Use professional typography, colors, and spacing
5. Focus on education marketing and enrollment

OUTPUT FORMAT (strict JSON):
{
  "name": "Site Name",
  "themeColor": "#hex",
  "pages": [
    { "id": "home", "title": "首页", "html": "<section>...</section>", "inNav": true }
  ]
}

Generate 3-4 pages. Output ONLY valid JSON.`;

    const { client, config } = await getModelClient();
    const response = await client.chat.completions.create(
      buildCompletionParams(config, [{ role: 'system', content: systemPrompt }], { requireJson: true, maxTokens: 8192 })
    );

    const raw = response.choices[0].message.content || '';
    const site = extractJSON(raw);

    if (!site || !site.pages) {
      throw new Error('Failed to parse webpage JSON from LLM output');
    }

    // 3. Auto-publish to /sites/slug
    let publishedUrl = '';
    try {
      publishedUrl = await publishSite(site);
    } catch (e: any) {
      console.warn('Auto-publish failed (non-fatal):', e.message);
    }

    // 4. Save result with published URL for downstream agents (e.g. Grace)
    const summary = `🌐 已生成 ${site.pages.length} 页宣传站点「${site.name}」${publishedUrl ? ` → ${publishedUrl}` : ''}`;
    const resultPayload = JSON.stringify({
      summary,
      content: raw,
      site,
      publishedUrl
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: task.requiresApproval ? 'AWAITING_APPROVAL' : 'COMPLETED',
        resultPayload
      }
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Iris agent error:', error);
    if (taskIdForError) {
      await prisma.task.update({
        where: { id: taskIdForError },
        data: { status: 'FAILED' }
      }).catch(console.error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
