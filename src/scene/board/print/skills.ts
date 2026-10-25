import { skillDomains, skillLanguages, skillIconNames } from "../../../content/skills";
import type { Skill } from "../../../content/skills";
import { siteFont } from "../../../assets/typography";

export function paintSkills(
  context: CanvasRenderingContext2D,
  atlas: ImageBitmap,
  width: number,
): void {
  const margin = width * 0.075;
  const columnWidth = (width - margin * 2) / 2;
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
  skillDomains.forEach((skill, index) => {
    const x = margin + (index % 2) * columnWidth;
    const y = 84 + Math.floor(index / 2) * 122;
    icon(skill, x, y, 80);
    context.fillStyle = "#294536";
    context.font = `500 64px ${siteFont}`;
    context.fillText(skill.label, x + 94, y + 30, columnWidth - 104);
    context.fillStyle = "#3f5748";
    context.font = `500 58px ${siteFont}`;
    context.fillText(skill.detail, x + 94, y + 82, columnWidth - 104);
  });
  context.fillStyle = "#bdc6b7";
  context.fillRect(margin, 592, width - margin * 2, 1);
  context.fillStyle = "#526b59";
  context.font = `500 44px ${siteFont}`;
  context.fillText("Languages", margin, 652);
  skillLanguages.forEach((skill, index) => {
    const x = margin + (index % 2) * columnWidth;
    const y = 684 + Math.floor(index / 2) * 94;
    icon(skill, x, y, 70);
    context.fillStyle = "#294536";
    context.font = `500 60px ${siteFont}`;
    context.fillText(skill.label, x + 94, y + 49, columnWidth - 104);
  });
}
