import { paperBodySize } from "./type";
import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";

export function paintProfile(
  context: OffscreenCanvasRenderingContext2D,
  avatar: ImageBitmap,
  language: ImageBitmap,
  width: number,
): void {
  const margin = width * 0.075;
  const imageSize = width * 0.14;
  context.drawImage(avatar, margin, margin, imageSize, imageSize);
  context.fillStyle = "#253b31";
  context.font = `500 ${width * 0.07}px ${siteFont}`;
  context.fillText(profile.name, margin + imageSize + width * 0.045, margin + imageSize * 0.68);
  context.strokeStyle = "#a6a797";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(margin, width * 0.245);
  context.lineTo(width - margin, width * 0.245);
  context.stroke();
  context.fillStyle = "#53645c";
  context.font = `500 ${width * 0.033}px ${siteFont}`;
  context.fillText("趣味", margin, width * 0.3);
  context.fillText("好きなもの", margin, width * 0.445);
  context.fillText("好きな言語", width * 0.58, width * 0.445);
  context.fillStyle = "#253b31";
  context.font = `500 ${width * paperBodySize}px ${siteFont}`;
  context.fillText(profile.hobbies, margin, width * 0.355);
  context.fillText(profile.favorite, margin, width * 0.505);
  context.drawImage(language, width * 0.58, width * 0.48, width * 0.065, width * 0.065);
}
