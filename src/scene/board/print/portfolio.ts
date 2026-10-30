import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";
import type { PaperLink } from "../paper-links";
import { paperBodySize } from "./type";

export function paintPortfolio(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  team: ImageBitmap,
): PaperLink[] {
  function heading(text: string, y: number, size: number): void {
    context.fillStyle = "#294536";
    context.font = `400 ${width * size}px "Yomogi"`;
    context.fillText(text, width * 0.04, width * y);
  }
  const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
  function paragraph(text: string, y: number, startX = 0.22): number {
    let x = startX;
    for (const { segment } of segmenter.segment(text)) {
      const length = context.measureText(segment).width / width;
      if (x + length > 0.96 && !/^[、。）」]/.test(segment)) {
        x = 0.22;
        y += 0.05;
      }
      context.fillText(segment, width * x, width * y);
      x += length;
    }
    return y + 0.05;
  }
  heading("活動記録", 0.09, 0.068);
  const links: PaperLink[] = [];
  let y = 0.17;
  for (const entry of profile.history) {
    context.strokeStyle = "#a6b6a6";
    context.lineWidth = width * 0.0015;
    context.beginPath();
    context.moveTo(width * 0.185, width * (y - 0.025));
    context.lineTo(width * 0.185, width * y);
    context.stroke();
    context.fillStyle = "#294536";
    context.beginPath();
    context.arc(width * 0.185, width * (y - 0.012), width * 0.004, 0, Math.PI * 2);
    context.fill();
    context.font = `500 ${width * paperBodySize}px ${siteFont}`;
    context.fillText(entry.date, width * 0.04, width * y);
    let startX = 0.22;
    if (entry.team) {
      const iconSize = width * paperBodySize;
      context.drawImage(team, width * startX, width * (y - 0.033), iconSize, iconSize);
      const textX = startX + 0.05;
      context.fillStyle = "#28594a";
      context.fillText(profile.team.label, width * textX, width * y);
      const textWidth = context.measureText(profile.team.label).width / width;
      context.fillRect(width * textX, width * (y + 0.004), width * textWidth, width * 0.001);
      links.push({
        ...profile.team,
        x: startX,
        y: (width * (y - 0.038)) / height,
        width: 0.05 + textWidth,
        height: (width * 0.05) / height,
      });
      startX = textX + textWidth;
    }
    context.fillStyle = "#253b31";
    let nextY = paragraph(entry.title, y, startX);
    if (entry.detail) nextY = paragraph(entry.detail, nextY);
    context.beginPath();
    context.moveTo(width * 0.185, width * y);
    context.lineTo(width * 0.185, width * (nextY + 0.008));
    context.stroke();
    y = nextY + 0.033;
  }
  heading("資格", y + 0.015, 0.046);
  context.fillStyle = "#253b31";
  context.font = `500 ${width * paperBodySize}px ${siteFont}`;
  for (const text of profile.qualifications) {
    context.fillText(text, width * 0.22, width * (y + 0.015));
    y += 0.05;
  }
  return links;
}
