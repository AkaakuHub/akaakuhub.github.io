import { skillDomains, skillLanguages, skillIconNames } from "../../../content/skills";
import type { Skill } from "../../../content/skills";
import { siteFont } from "../../../assets/typography";

export function paintSkills(
  context: CanvasRenderingContext2D,
  atlas: ImageBitmap,
  width: number,
  height: number,
): void {
  const portrait = height > width * 0.8;
  const margin = width * 0.09;
  const columns = portrait ? 2 : 4;
  if (portrait) {
    context.font = '400 104px "Yomogi"';
    context.textAlign = "center";
    context.fillStyle = "#294536";
    context.fillText("Skills", width / 2, 135);
  }
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
  const domainWidth = (width - margin * 2) / columns;
  skillDomains.forEach((skill, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + column * domainWidth;
    const y = portrait ? 190 + row * 148 : 85 + row * 72;
    const labelX = x + (portrait ? 105 : 51);
    icon(skill, x, y, portrait ? 88 : 43);
    context.textAlign = "left";
    context.fillStyle = "#294536";
    context.font = `500 ${portrait ? 56 : 26}px ${siteFont}`;
    context.fillText(
      skill.label,
      labelX,
      y + (portrait ? 38 : 19),
      domainWidth - (portrait ? 105 : 55),
    );
    context.fillStyle = "#3f5748";
    context.font = `500 ${portrait ? 48 : 17}px ${siteFont}`;
    context.fillText(
      skill.detail,
      labelX,
      y + (portrait ? 85 : 40),
      domainWidth - (portrait ? 105 : 55),
    );
  });
  context.fillStyle = "#bdc6b7";
  context.fillRect(margin, portrait ? 800 : 236, width - margin * 2, 1);
  context.fillStyle = "#738175";
  context.font = `500 ${portrait ? 44 : 22}px ${siteFont}`;
  context.textAlign = "left";
  context.fillText("Languages", margin, portrait ? 860 : 270);
  const languageWidth = (width - margin * 2) / columns;
  skillLanguages.forEach((skill, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + column * languageWidth;
    const y = portrait ? 900 + row * 108 : 290 + row * 92;
    icon(skill, x, y, portrait ? 80 : 45);
    context.fillStyle = "#294536";
    context.font = `500 ${portrait ? 52 : 25}px ${siteFont}`;
    context.fillText(
      skill.label,
      x + (portrait ? 100 : 55),
      y + (portrait ? 54 : 31),
      languageWidth - (portrait ? 100 : 62),
    );
  });
}
