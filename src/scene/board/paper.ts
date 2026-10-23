import { CanvasTexture, SRGBColorSpace } from "three";

export function paperTexture(
  title: string,
  lines: readonly string[],
  accent: string,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("紙の描画に失敗しました。");
  ctx.fillStyle = "#f5f1e5";
  ctx.fillRect(0, 0, 768, 1024);
  for (let y = 0; y < 1024; y += 3) {
    ctx.fillStyle = `rgba(100,83,55,${0.015 + (y % 7) * 0.003})`;
    ctx.fillRect(0, y, 768, 1);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(62, 76, 70, 8);
  ctx.font = "600 56px sans-serif";
  ctx.fillText(title, 62, 190);
  ctx.fillStyle = "#3f453f";
  ctx.font = "32px sans-serif";
  lines.forEach((line, index) => ctx.fillText(line, 62, 300 + index * 64));
  ctx.strokeStyle = "#d4cebc";
  ctx.beginPath();
  ctx.moveTo(62, 860);
  ctx.lineTo(706, 860);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "24px monospace";
  ctx.fillText("AKAAKUHUB", 62, 920);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
