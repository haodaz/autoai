import { NextResponse } from 'next/server';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';

export const maxDuration = 120;

/**
 * Robust JSON extraction: handles markdown fences, trailing text, etc.
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
 * POST — Generate a multi-page marketing website
 */
export async function POST(req: Request) {
  try {
    const { topic, background, preferences, pageCount, style } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const { client, config } = await getModelClient();

    const styleGuide: Record<string, string> = {
      'modern-tech': 'Modern tech aesthetic: dark navy/slate backgrounds, vibrant accent colors, geometric patterns, gradient overlays, glass-morphism cards',
      'education': 'Education/academic: warm whites, trustworthy blue tones, campus imagery placeholders, serif headings for tradition',
      'business': 'Business professional: clean white backgrounds, navy/gray palette, minimal borders, executive feel',
    };

    const systemPrompt = `You are a world-class web designer specializing in marketing landing pages and enrollment brochures.

Generate a complete multi-page website as a JSON object. The site should be visually stunning, using modern web design with Tailwind CSS classes.

CRITICAL REQUIREMENTS:
1. All HTML must use Tailwind CSS classes (loaded via CDN <script src="https://cdn.tailwindcss.com">)
2. Use inline styles only for custom colors/gradients not available in Tailwind
3. Include image placeholders using this format:
   <div class="relative group cursor-pointer" data-image-placeholder="true">
     <div class="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center" style="height:240px">
       <div class="text-center">
         <div class="text-4xl mb-2">📷</div>
         <div class="text-sm text-gray-500 font-medium">点击替换图片</div>
         <div class="text-xs text-gray-400 mt-1">建议尺寸: 800×600</div>
       </div>
     </div>
   </div>
4. Make it mobile-responsive with responsive Tailwind classes
5. Use professional typography and spacing
6. Each page should have rich, detailed content sections
7. Design style: ${styleGuide[style] || styleGuide['education']}

OUTPUT FORMAT (strict JSON):
{
  "name": "Site Name",
  "themeColor": "#hex_color",
  "pages": [
    {
      "id": "home",
      "title": "页面标题",
      "html": "<section>...full HTML content...</section>",
      "inNav": true
    }
  ]
}

Generate ${pageCount || 3} pages. The HTML for each page should be self-contained sections (no <html>, <head>, <body> tags — just the content sections).
Include at least 3-4 image placeholders across the site where marketing photos would go.`;

    const userPrompt = `Create a marketing website for: ${topic}
${background ? `\nBackground materials:\n${background}` : ''}
${preferences ? `\nAdditional requirements:\n${preferences}` : ''}

Output ONLY valid JSON. No markdown, no explanations.`;

    const response = await client.chat.completions.create(
      buildCompletionParams(config, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { requireJson: true, maxTokens: 8192 })
    );

    const raw = response.choices?.[0]?.message?.content || '';
    const site = extractJSON(raw);

    if (!site || !site.pages || !Array.isArray(site.pages)) {
      console.error('Failed to parse webpage JSON:', raw.substring(0, 500));
      return NextResponse.json({ error: 'Failed to parse AI output', raw: raw.substring(0, 200) }, { status: 500 });
    }

    return NextResponse.json({ success: true, site });
  } catch (error: any) {
    console.error('Webpage generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
