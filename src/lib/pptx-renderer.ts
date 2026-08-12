import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs/promises';

// ============================================
// Shared PPTX Renderer
// Used by both Toolbox (manual tool call) and Edda (AI agent)
// ============================================

export interface SlideData {
  title: string;
  bullets: string[];
}

// Theme color palettes
const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string; text: string; bg: string }> = {
  graphite: { primary: '2D3436', secondary: 'DFE6E9', accent: '0984E3', text: '2D3436', bg: 'FFFFFF' },
  blue:     { primary: '1E3A8A', secondary: 'DBEAFE', accent: '3B82F6', text: '1E3A5A', bg: 'F0F5FF' },
  emerald:  { primary: '065F46', secondary: 'D1FAE5', accent: '10B981', text: '064E3B', bg: 'F0FDF4' },
  light:    { primary: '64748B', secondary: 'F1F5F9', accent: '94A3B8', text: '334155', bg: 'FFFFFF' },
};

export interface RenderPPTXOptions {
  slides: SlideData[];
  theme?: string;
  coverTitle?: string;
  coverSubtitle?: string;
}

/**
 * Render a .pptx file from structured slide data.
 * Returns the download URL path.
 */
export async function renderPPTX(options: RenderPPTXOptions): Promise<{ fileUrl: string; fileName: string }> {
  const { slides, theme = 'blue', coverTitle, coverSubtitle } = options;
  const colors = THEME_COLORS[theme] || THEME_COLORS.blue;
  
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Cover Slide
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: colors.primary };
  coverSlide.addText(coverTitle || 'Bristh Enrollment Partners', {
    x: '10%', y: '35%', w: '80%', h: 1,
    fontSize: 36, color: 'FFFFFF', bold: true, align: 'center',
  });
  coverSlide.addText(coverSubtitle || 'Professional Presentation', {
    x: '10%', y: '55%', w: '80%', h: 0.8,
    fontSize: 20, color: 'E2E8F0', align: 'center',
  });

  // Content Slides
  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: colors.bg };

    // Title bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.9,
      fill: { color: colors.primary },
    });
    slide.addText(s.title || `Slide ${i + 1}`, {
      x: 0.5, y: 0, w: '85%', h: 0.9,
      fontSize: 24, color: 'FFFFFF', bold: true, align: 'left',
    });

    // Page number
    slide.addText(`${i + 1}`, {
      x: '90%', y: 0, w: '8%', h: 0.9,
      fontSize: 14, color: 'FFFFFF', align: 'center', italic: true,
    });

    // Bullets
    if (s.bullets && s.bullets.length > 0) {
      const bulletText = s.bullets.map(b => ({
        text: b,
        options: { bullet: { type: 'bullet' as const }, fontSize: 16, color: colors.text, breakLine: true, lineSpacingMultiple: 1.5 },
      }));
      slide.addText(bulletText, {
        x: 0.6, y: 1.3, w: '88%', h: '70%',
        valign: 'top',
      });
    }

    // Accent bar at bottom
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: '95%', w: '100%', h: '5%',
      fill: { color: colors.accent },
    });
  });

  const fileName = `PPT_${Date.now()}.pptx`;
  const base64 = await pptx.write({ outputType: 'base64' }) as string;
  const dataUri = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`;

  return { fileUrl: dataUri, fileName };
}
