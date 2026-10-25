import { skillDomains, skillLanguages, skillIconNames } from "../../../content/skills";
import type { Skill } from "../../../content/skills";
import { siteFont } from "../../../assets/typography";

export function paintSkills(
  context: CanvasRenderingContext2D,
  atlas: ImageBitmap,
  width: number,
): void {
  const margin = width * 0.06;
  function icon(skill: Skill, x: number, y: number, size: number) {
    const index = skillIconNames.indexOf(skill.icon);
    if (index < 0) throw new Error(`スキルのアイコンがありません: ${skill.icon}`);
    context.drawImage(
      atlas,
      (index % 4) * 128,
      Math.floor(index / 4) * 128,
      128,
      128,
      x,
      y,
      size,
      size,
    );
  }
  context.fillStyle = "#738175";
  context.font = `500 23px ${siteFont}`;
  context.textAlign = "center";
  context.fillText("つくるもの", width / 2, 40);
  context.textAlign = "left";
  const domainWidth = (width - margin * 2) / 3;
  skillDomains.forEach((skill, index) => {
    const x = margin + (index % 3) * domainWidth;
    const y = 64 + Math.floor(index / 3) * 81;
    icon(skill, x, y, 53);
    context.fillStyle = "#294536";
    context.font = `500 30px ${siteFont}`;
    context.fillText(skill.label, x + 64, y + 25);
    context.fillStyle = "#657566";
    context.font = `500 20px ${siteFont}`;
    context.fillText(skill.detail, x + 64, y + 54, domainWidth - 72);
  });
  context.fillStyle = "#bdc6b7";
  context.fillRect(margin, 226, width - margin * 2, 1);
  context.fillStyle = "#738175";
  context.font = `500 23px ${siteFont}`;
  context.fillText("Languages", margin, 263);
  const languageWidth = (width - margin * 2) / 4;
  skillLanguages.forEach((skill, index) => {
    const x = margin + (index % 4) * languageWidth;
    const y = 283 + Math.floor(index / 4) * 81;
    icon(skill, x, y, 53);
    context.fillStyle = "#294536";
    context.font = `500 27px ${siteFont}`;
    context.fillText(skill.label, x + 65, y + 35, languageWidth - 75);
  });
}
