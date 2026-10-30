import { privacy } from "../../../content/privacy";
import { siteFont } from "../../../assets/typography";
import { paperBodySize } from "./type";
import type { PaperLink } from "../paper-links";

export function paintPrivacy(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
): PaperLink[] {
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
  const links: PaperLink[] = [];
  const googleLabel = "Googleのデータ利用";
  context.fillText(googleLabel, margin, y);
  const textWidth = context.measureText(googleLabel).width;
  context.fillRect(margin, y + width * 0.006, textWidth, width * 0.001);
  links.push({
    label: googleLabel,
    href: privacy.google,
    x: margin / width,
    y: (y - lineHeight) / height,
    width: textWidth / width,
    height: (lineHeight * 1.3) / height,
  });
  y += width * 0.05;
  const buttonHeight = width * 0.095;
  const buttonWidth = width - margin * 2;
  context.fillStyle = "#294536";
  context.beginPath();
  context.roundRect(margin, y, buttonWidth, buttonHeight, width * 0.012);
  context.fill();
  context.fillStyle = "#f3eee0";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("計測を停止する", width / 2, y + buttonHeight / 2);
  links.push({
    label: "計測を停止する",
    href: privacy.optout,
    x: margin / width,
    y: y / height,
    width: buttonWidth / width,
    height: buttonHeight / height,
  });
  return links;
}
