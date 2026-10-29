import { CanvasTexture, SRGBColorSpace } from "three";

export function createComputerScreen(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 576;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PC画面を作成できません。");
  context.fillStyle = "#101815";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#d8e4de";
  context.font = "32px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("鋭意制作中...", canvas.width / 2, canvas.height / 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
