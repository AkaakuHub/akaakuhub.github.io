import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";

export function paintProfile(
  context: OffscreenCanvasRenderingContext2D,
  avatar: ImageBitmap,
  language: ImageBitmap,
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
  const rows = [
    { label: "趣味", value: profile.hobbies },
    { label: "好きなもの", value: profile.favorite },
  ];
  let y = width * 0.38;
  for (const row of rows) {
    context.fillStyle = "#53645c";
    context.font = `500 ${width * 0.033}px ${siteFont}`;
    context.fillText(row.label, margin, y);
    context.fillStyle = "#253b31";
    context.font = `500 ${width * 0.039}px ${siteFont}`;
    context.fillText(row.value, margin, y + width * 0.065);
    y += width * 0.16;
  }
  context.fillStyle = "#53645c";
  context.font = `500 ${width * 0.033}px ${siteFont}`;
  context.fillText("好きな言語", margin, y);
  context.drawImage(
    language,
    margin + width * 0.22,
    y - width * 0.04,
    width * 0.065,
    width * 0.065,
  );
}
