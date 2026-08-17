const PptxGenJS = require('pptxgenjs');

try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: '1E3A8A' } });
    slide.addText('Slide Title', {
        x: 0.5, y: 0, w: '90%', h: 0.8,
        fontSize: 24, color: 'FFFFFF', bold: true, align: 'left'
    });

    console.log("PPT object built successfully");
} catch(e) {
    console.error("Error building PPT", e);
}
