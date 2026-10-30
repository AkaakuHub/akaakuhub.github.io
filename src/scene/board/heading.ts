import { textureFromCanvas } from "../materials/printed-texture";

export function createBoardLettering() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1376;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("ホワイトボードの文字を描画できませんでした。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / 2.56;
  const ink = document.createElement("canvas");
  ink.width = 1024;
  ink.height = 256;
  const pen = ink.getContext("2d");
  if (!pen) throw new Error("ホワイトボードの見出しを描画できませんでした。");
  pen.font = '400 156px "Yomogi"';
  pen.fillStyle = "#284a40";
  for (const [text, x, y] of [
    ["活動記録", 0.33, 2.23],
    ["GitHub", -0.79, 1.72],
    ["最新記事", -0.79, 1.13],
  ] as const) {
    pen.clearRect(0, 0, ink.width, ink.height);
    const metrics = pen.measureText(text);
    pen.fillText(text, 36, 160 - metrics.actualBoundingBoxDescent);
    context.save();
    context.translate((x + 1.28) * scale, (2.36 - y) * scale);
    context.rotate(0.012);
    context.drawImage(ink, -0.325 * scale, -0.08125 * scale, 0.65 * scale, 0.1625 * scale);
    context.restore();
  }
  ink.height = 128;
  pen.font = '400 73px "Yomogi"';
  pen.fillStyle = "#53645c";
  pen.fillText("Weather by Open-Meteo", 18, 88);
  context.drawImage(
    ink,
    (0.9 + 1.28 - 0.322) * scale,
    (2.36 - 0.68 - 0.0252) * scale,
    0.644 * scale,
    0.0504 * scale,
  );
  const texture = textureFromCanvas(context);
  texture.channel = 1;
  texture.anisotropy = 8;
  return texture;
}
