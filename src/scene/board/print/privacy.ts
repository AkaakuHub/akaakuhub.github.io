import { privacy } from "../../../content/privacy";
import { siteFont } from "../../../assets/typography";
import { paperBodySize } from "./type";

export function paintPrivacy(context: OffscreenCanvasRenderingContext2D, width: number): void {
  const margin = width * 0.06;
  const lineHeight = width * paperBodySize * 1.4;
  let y = width * 0.11;
  context.fillStyle = "#253b31";
  context.font = `500 ${width * 0.055}px ${siteFont}`;
  context.fillText(privacy.title, margin, y);
  y += width * 0.095;
  function paragraph(text: string): void {
    let line = "";
    for (const character of text) {
      if (line && context.measureText(line + character).width > width - margin * 2) {
        context.fillText(line, margin, y);
        y += lineHeight;
        line = "";
      }
      line += character;
    }
    if (line) {
      context.fillText(line, margin, y);
      y += lineHeight;
    }
  }
  for (const section of privacy.sections) {
    context.font = `500 ${width * 0.046}px ${siteFont}`;
    paragraph(section.title);
    context.font = `500 ${width * paperBodySize}px ${siteFont}`;
    paragraph(section.text);
    y += width * 0.025;
  }
  context.font = `500 ${width * paperBodySize}px ${siteFont}`;
  paragraph(privacy.operator);
  paragraph(`更新: ${privacy.updated}`);
  y += width * 0.025;
  paragraph("Googleのデータ利用");
  y += width * 0.02;
  paragraph("計測を停止する");
}
