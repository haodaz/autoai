// Slide element positioning and styling types for WYSIWYG PPT editor
// Adapted from vertical-notebook's types.ts

export interface SlideElementStyle {
  fontSize: number;       // in rem units
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
}

export interface SlideElement {
  id: string;
  type: 'TEXT_BOX';
  content: string;
  x: number;        // percentage 0-100
  y: number;        // percentage 0-100
  width: number;    // percentage 0-100
  height: number;   // percentage 0-100
  style: SlideElementStyle;
}

export interface Slide {
  backgroundColor: string;
  elements: SlideElement[];
}

export type PresentationTheme = 'graphite' | 'blue' | 'emerald' | 'light';
export type ContentDensity = 'comprehensive' | 'standard' | 'concise' | 'minimalist';

// Helper: convert legacy {title, bullets} to new Slide format
export function legacyToSlides(legacy: { title: string; bullets: string[] }[]): Slide[] {
  return legacy.map((page, i) => ({
    backgroundColor: '#ffffff',
    elements: [
      {
        id: `title-${i}-${Date.now()}`,
        type: 'TEXT_BOX' as const,
        content: page.title,
        x: 8, y: 8, width: 84, height: 14,
        style: { fontSize: 2.4, fontWeight: 'bold' as const, textAlign: 'left' as const, color: '#1a1a2e', backgroundColor: 'transparent', padding: 1, borderRadius: 0 }
      },
      {
        id: `body-${i}-${Date.now()}`,
        type: 'TEXT_BOX' as const,
        content: page.bullets.map(b => `• ${b}`).join('\n'),
        x: 8, y: 28, width: 84, height: 62,
        style: { fontSize: 1.1, fontWeight: 'normal' as const, textAlign: 'left' as const, color: '#333333', backgroundColor: 'transparent', padding: 1, borderRadius: 0 }
      }
    ]
  }));
}

// Helper: create a blank new slide
export function createNewSlide(): Slide {
  const ts = Date.now();
  return {
    backgroundColor: '#ffffff',
    elements: [
      {
        id: `title-${ts}`,
        type: 'TEXT_BOX',
        content: '新页面标题',
        x: 10, y: 10, width: 80, height: 15,
        style: { fontSize: 2.4, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent', padding: 1, borderRadius: 0 }
      },
      {
        id: `body-${ts}-b`,
        type: 'TEXT_BOX',
        content: '在此输入内容...',
        x: 10, y: 30, width: 80, height: 60,
        style: { fontSize: 1.1, fontWeight: 'normal', textAlign: 'left', color: '#333333', backgroundColor: 'transparent', padding: 1, borderRadius: 0 }
      }
    ]
  };
}
