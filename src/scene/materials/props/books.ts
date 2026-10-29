import { textureFromCanvas } from "../printed-texture";
import { RepeatWrapping, Vector2 } from "three";
import type { PbrMaps } from "../library";
import { scannedSurface } from "../surface";

export function bookLabelMaterial(paper: PbrMaps) {
  const stock = paper.map.image;
  if (!stock) throw new Error("背表紙の画像が準備されていません。");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("本の背表紙を描画できませんでした。");
  const titles = [
    "回路",
    "写真",
    "資料",
    "工作",
    "記録",
    "図録",
    "電気",
    "修理",
    "通信",
    "手帖",
    "読書",
    "図面",
    "観測",
    "実験",
    "音楽",
    "活動",
  ];
  for (const [index, title] of titles.entries()) {
    const x = (index % 4) * 256;
    const y = Math.floor(index / 4) * 256;
    context.drawImage(stock, x, y, 256, 256);
    context.fillStyle = "#29382f";
    context.font = "500 62px serif";
    context.textAlign = "center";
    for (const [line, character] of [...title].entries())
      context.fillText(character, x + 128, y + 100 + line * 76);
    context.strokeStyle = "#6d7466";
    context.lineWidth = 1;
    context.strokeRect(x + 22, y + 17, 212, 222);
  }
  const map = textureFromCanvas(context);
  map.anisotropy = paper.map.anisotropy;
  const normalMap = paper.normalMap.clone();
  normalMap.channel = 1;
  const roughnessMap = paper.roughnessMap.clone();
  roughnessMap.channel = 1;
  return scannedSurface(paper, {
    map,
    normalMap,
    roughnessMap,
    normalScale: new Vector2(0.1, 0.1),
  });
}

export function pageEdgeMaterial(paper: PbrMaps) {
  const stock = paper.map.image;
  if (!stock) throw new Error("小口の画像が準備されていません。");
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("本の小口を描画できませんでした。");
  context.drawImage(stock, 0, 0, 1024, 256);
  for (let page = 0; page < 16; page++) {
    context.fillStyle = `rgba(76,65,44,${0.025 + (page % 5) * 0.008})`;
    context.fillRect(0, page * 16, 1024, 2);
    context.fillStyle = "rgba(255,255,245,0.16)";
    context.fillRect(0, page * 16 + 2, 1024, 3);
  }
  const map = textureFromCanvas(context);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(1 / 0.3, 1 / 0.0024);
  map.anisotropy = paper.map.anisotropy;
  const normalMap = paper.normalMap.clone();
  normalMap.channel = 1;
  const roughnessMap = paper.roughnessMap.clone();
  roughnessMap.channel = 1;
  return scannedSurface(paper, {
    map,
    normalMap,
    roughnessMap,
    normalScale: new Vector2(0.08, 0.08),
  });
}
