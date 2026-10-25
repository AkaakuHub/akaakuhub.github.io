import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";

export function paintProfile(
  context: CanvasRenderingContext2D,
  avatar: ImageBitmap,
  width: number,
): void {
  const margin = width * 0.075;
  const imageSize = width * 0.18;
  context.drawImage(avatar, margin, margin, imageSize, imageSize);
  context.fillStyle = "#253b31";
  context.font = `500 ${width * 0.07}px ${siteFont}`;
  context.fillText(profile.name, margin + imageSize + width * 0.045, margin + imageSize * 0.68);
  context.strokeStyle = "#a6a797";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(margin, width * 0.3);
  context.lineTo(width - margin, width * 0.3);
  context.stroke();
  const columnWidth = (width - margin * 2) / 2;
  for (const [index, label] of ["好きなこと", "趣味", "好きな言語", "ひとこと"].entries()) {
    const x = margin + (index % 2) * columnWidth;
    const y = width * (0.37 + Math.floor(index / 2) * 0.23);
    context.fillStyle = "#253b31";
    context.font = `500 ${width * 0.04}px ${siteFont}`;
    context.fillText(label, x, y);
    context.strokeStyle = "#c0bdb0";
    context.beginPath();
    context.moveTo(x, y + width * 0.16);
    context.lineTo(x + columnWidth - width * 0.04, y + width * 0.16);
    context.stroke();
  }
}
