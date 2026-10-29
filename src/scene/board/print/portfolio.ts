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
  function heading(text: string, x: number, y: number, size = 0.046): void {
    context.fillStyle = "#294536";
    context.font = `400 ${width * size}px "Yomogi"`;
    context.fillText(text, width * x, width * y);
  }
  function paragraph(text: string, x: number, y: number): number {
    context.fillStyle = "#253b31";
    context.font = `500 ${width * paperBodySize}px ${siteFont}`;
    let line = "";
    for (const character of text) {
      if (line && context.measureText(line + character).width > width * 0.41) {
        context.fillText(line, width * x, width * y);
        y += 0.048;
        line = "";
      }
      line += character;
    }
    context.fillText(line, width * x, width * y);
    return y + 0.048;
  }
  heading("活動・資格", 0.06, 0.105, 0.068);
  heading("所属", 0.06, 0.175);
  let y = 0.23;
  for (const text of profile.education) y = paragraph(text, 0.06, y);
  heading("活動", 0.06, 0.4);
  paragraph(profile.activities[0], 0.06, 0.46);
  context.font = `500 ${width * paperBodySize}px ${siteFont}`;
  const iconSize = width * paperBodySize;
  context.drawImage(team, width * 0.06, width * 0.482, iconSize, iconSize);
  context.fillStyle = "#28594a";
  const textX = width * 0.11;
  const baseline = width * 0.515;
  context.fillText(profile.team.label, textX, baseline);
  const textWidth = context.measureText(profile.team.label).width;
  context.fillRect(textX, baseline + width * 0.004, textWidth, width * 0.001);
  paragraph("でのグループ開発", 0.06, 0.565);
  heading("資格", 0.06, 0.63);
  for (const text of profile.qualifications) paragraph(text, 0.06, 0.685);
  heading("受賞", 0.53, 0.175);
  y = 0.23;
  for (const award of profile.awards) {
    y = paragraph(`${award.year}年 ${award.title}`, 0.53, y);
    y = paragraph(award.prize, 0.53, y) + 0.018;
  }
  return [
    {
      ...profile.team,
      x: 0.06,
      y: (width * 0.477) / height,
      width: 0.05 + textWidth / width,
      height: (width * 0.05) / height,
    },
  ];
}
