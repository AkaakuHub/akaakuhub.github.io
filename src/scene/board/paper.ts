import type { PbrMaps } from "../materials/library";
import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";

import type { BoardNotice } from "./notices";

function wrapText(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    const next = line + character;
    if (line && context.measureText(next).width > width) {
      lines.push(line);
      line = character;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function printedPaper(
  print: BoardNotice,
  maps: PbrMaps,
  sheetWidth: number,
  sheetHeight: number,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sheetWidth * 1200);
  canvas.height = Math.round(sheetHeight * 1200);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("掲示用紙を描画できませんでした。");
  const width = canvas.width;
  const height = canvas.height;
  const margin = width * 0.06;
  const stock = maps.map.image;
  if (!stock) throw new Error("掲示用紙の画像が準備されていません。");
  const pattern = context.createPattern(stock, "repeat");
  if (!pattern) throw new Error("紙の繊維を描画できませんでした。");
  pattern.setTransform(
    new DOMMatrix().scale(
      (0.3 * width) / (sheetWidth * stock.width),
      (0.3 * height) / (sheetHeight * stock.height),
    ),
  );
  context.fillStyle = pattern;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "multiply";
  context.fillStyle = print.stock;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = print.ink;
  const compact = print.kind === "repository";
  const headingSize = width * (compact ? 0.031 : print.kind === "profile" ? 0.065 : 0.043);
  context.font = width * 0.019 + "px monospace";
  context.fillText(print.eyebrow, margin, compact ? 30 : 100);
  context.font = "600 " + headingSize + "px sans-serif";
  const lines = wrapText(context, print.title, width - margin * 2);
  const headingY = compact ? 77 : 180;
  const lineHeight = headingSize * 1.4;
  lines.forEach((line, index) => context.fillText(line, margin, headingY + index * lineHeight));
  context.font = width * 0.028 + "px sans-serif";
  let y = headingY + lines.length * lineHeight + 22;
  for (const line of print.lines.filter(Boolean)) {
    for (const wrapped of wrapText(context, line, width - margin * 2)) {
      context.fillText(wrapped, margin, y);
      y += width * 0.04;
    }
  }
  context.fillStyle = print.ink;
  context.fillRect(margin, height - 57, width - margin * 2, 1);
  context.font = width * 0.021 + "px sans-serif";
  context.fillText(print.link.label + " ↗", margin, height - 23);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createPaper(
  width: number,
  height: number,
  print: BoardNotice,
  maps: PbrMaps,
): Mesh {
  const geometry = new PlaneGeometry(width, height, 20, 24);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index++) {
    const u = positions.getX(index) / width + 0.5;
    const v = positions.getY(index) / height + 0.5;
    const corner = Math.max(0, (u - 0.6) / 0.4) * Math.max(0, (0.4 - v) / 0.4);
    const lift = 0.00025 + 0.002 * (1 - v) ** 2 + 0.012 * corner ** 2;
    positions.setZ(index, lift);
  }
  geometry.computeVertexNormals();
  const surfaceUv = geometry.getAttribute("uv").clone();
  for (let index = 0; index < surfaceUv.count; index++)
    surfaceUv.setXY(index, surfaceUv.getX(index) * width, surfaceUv.getY(index) * height);
  geometry.setAttribute("uv1", surfaceUv);
  const normalMap = maps.normalMap.clone();
  normalMap.channel = 1;
  const paper = new Mesh(
    geometry,
    new MeshStandardMaterial({
      map: printedPaper(print, maps, width, height),
      normalMap,
      normalScale: new Vector2(0.04, 0.04),
      roughness: 1,
      side: DoubleSide,
    }),
  );
  paper.castShadow = true;
  paper.receiveShadow = true;
  return paper;
}
