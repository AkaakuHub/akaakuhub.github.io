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
  const domainWidth = (width - margin * 2) / 4;
  skillDomains.forEach((skill, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = margin + column * domainWidth;
    const y = 30 + row * 72;
    icon(skill, x, y, 43);
    context.textAlign = "left";
    context.fillStyle = "#294536";
    context.font = `500 26px ${siteFont}`;
    context.fillText(skill.label, x + 51, y + 19, domainWidth - 55);
    context.fillStyle = "#657566";
    context.font = `500 17px ${siteFont}`;
    context.fillText(skill.detail, x + 51, y + 40, domainWidth - 55);
  });
  context.fillStyle = "#bdc6b7";
  context.fillRect(margin, 184, width - margin * 2, 1);
  context.fillStyle = "#738175";
  context.font = `500 22px ${siteFont}`;
  context.textAlign = "left";
  context.fillText("Languages", margin, 218);
  const languageWidth = (width - margin * 2) / 4;
  skillLanguages.forEach((skill, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = margin + column * languageWidth;
    const y = 234 + row * 92;
    icon(skill, x, y, 45);
    context.fillStyle = "#294536";
    context.font = `500 25px ${siteFont}`;
    context.fillText(skill.label, x + 55, y + 31, languageWidth - 62);
  });
}
