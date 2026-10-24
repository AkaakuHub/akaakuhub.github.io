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

interface PaperPrint {
  title: string;
  lines: readonly string[];
  ink: string;
  stock: string;
  link: { label: string; href: string };
}

function printedPaper(
  print: PaperPrint,
  maps: PbrMaps,
  sheetWidth: number,
  sheetHeight: number,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 1344;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("掲示用紙を描画できませんでした。");
  context.scale(1.5, 1.5);
  const width = 640;
  const height = 896;
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
  const margin = 60;
  const headingY = 220;
  context.fillStyle = print.ink;
  context.fillRect(margin, 78, 17, 17);
  context.font = "600 56px sans-serif";
  context.fillText(print.title, margin, headingY);
  context.strokeStyle = print.ink;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(margin, headingY + 42);
  context.lineTo(width - margin, headingY + 42);
  context.stroke();
  context.fillStyle = "#111b15";
  const firstLine = headingY + 155;
  for (const [index, line] of print.lines.entries()) {
    context.font = index === 0 ? "32px sans-serif" : "25px monospace";
    context.fillText(line, margin, firstLine + index * 65);
  }
  context.fillStyle = print.ink;
  context.font = "600 29px sans-serif";
  context.fillText(`${print.link.label} →`, margin, height - 142);
  context.fillRect(margin, height - 128, width - margin * 2, 1);
  context.fillStyle = "#28382f";
  context.font = "20px monospace";
  context.fillText(print.link.href.replace("https://", ""), margin, height - 86);
  const fold = context.createLinearGradient(width - 45, height - 80, width, height);
  fold.addColorStop(0, "rgba(102,91,66,0)");
  fold.addColorStop(1, "rgba(102,91,66,0.06)");
  context.fillStyle = fold;
  context.fillRect(width - 60, height - 90, 60, 90);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createPaper(width: number, height: number, print: PaperPrint, maps: PbrMaps): Mesh {
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
