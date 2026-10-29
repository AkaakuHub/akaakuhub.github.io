import { privacy } from "../../../content/privacy";
import { siteFont } from "../../../assets/typography";

export function paintPrivacy(context: OffscreenCanvasRenderingContext2D, width: number): void {
  const margin = width * 0.08;
  let y = width * 0.13;
  context.fillStyle = "#253b31";
  context.font = `500 ${width * 0.055}px ${siteFont}`;
  context.fillText(privacy.title, margin, y);
  y += width * 0.095;
  function paragraph(text: string): void {
    let line = "";
    for (const character of text) {
      if (line && context.measureText(line + character).width > width - margin * 2) {
        context.fillText(line, margin, y);
        y += width * 0.043;
        line = "";
      }
      line += character;
    }
    if (line) {
      context.fillText(line, margin, y);
      y += width * 0.043;
    }
  }
  for (const section of privacy.sections) {
    context.font = `500 ${width * 0.032}px ${siteFont}`;
    paragraph(section.title);
    context.font = `500 ${width * 0.026}px ${siteFont}`;
    paragraph(section.text);
    y += width * 0.035;
  }
  context.font = `500 ${width * 0.022}px ${siteFont}`;
  paragraph(privacy.operator);
  paragraph(`更新: ${privacy.updated}`);
  y += width * 0.025;
  context.font = `500 ${width * 0.02}px ${siteFont}`;
  paragraph("Googleのデータ利用");
  paragraph(privacy.google);
  y += width * 0.02;
  paragraph("計測を停止する");
  paragraph(privacy.optout);
}
