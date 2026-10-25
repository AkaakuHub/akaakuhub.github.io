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
import { siteFont } from "../../assets/typography";
import { paintArticle } from "./print/article";
import { paintSkills } from "./print/skills";

function printedPaper(
  print: BoardNotice,
  maps: PbrMaps,
  sheetWidth: number,
  sheetHeight: number,
  skillAtlas: ImageBitmap,
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
  if (print.kind === "article") {
    paintArticle(context, print, width, height);
  } else {
    if (print.kind === "skills") paintSkills(context, skillAtlas, width);
    context.fillStyle = print.ink;
    if (print.link) {
      context.fillRect(margin, height - 57, width - margin * 2, 1);
      context.font = `500 ${width * 0.021}px ${siteFont}`;
      context.fillText(print.link.label + " ↗", margin, height - 23);
    }
  }
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
  skillAtlas: ImageBitmap,
): Mesh<PlaneGeometry, MeshStandardMaterial> {
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
      map: printedPaper(print, maps, width, height, skillAtlas),
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

export function updatePaper(
  paper: Mesh<PlaneGeometry, MeshStandardMaterial>,
  print: BoardNotice,
  maps: PbrMaps,
  skillAtlas: ImageBitmap,
): void {
  const previous = paper.material.map;
  paper.material.map = printedPaper(print, maps, print.size[0], print.size[1], skillAtlas);
  previous?.dispose();
}
