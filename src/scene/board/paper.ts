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
import { paintProfile } from "./print/profile";
import { paintLink } from "./print/link";

function printedPaper(
  print: BoardNotice,
  maps: PbrMaps,
  sheetWidth: number,
  sheetHeight: number,
  avatar: ImageBitmap,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  const density = 2048 / Math.max(sheetWidth, sheetHeight);
  canvas.width = Math.round(sheetWidth * density);
  canvas.height = Math.round(sheetHeight * density);
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
    if (print.kind === "profile") paintProfile(context, avatar, width);
    context.fillStyle = print.ink;
    if (print.link) {
      context.fillRect(margin, height - width * 0.085, width - margin * 2, 1);
      context.font = `500 ${width * 0.042}px ${siteFont}`;
      paintLink(context, print.link.label, margin, height - width * 0.028, width * 0.042);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function paperGeometry(width: number, height: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, height, 12, 16);
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
  return geometry;
}

export function createPaper(
  width: number,
  height: number,
  print: BoardNotice,
  maps: PbrMaps,
  avatar: ImageBitmap,
): Mesh<PlaneGeometry, MeshStandardMaterial> {
  const paper = new Mesh(
    paperGeometry(width, height),
    new MeshStandardMaterial({
      map: printedPaper(print, maps, width, height, avatar),
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      normalScale: new Vector2(0.1, 0.1),
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
  avatar: ImageBitmap,
): void {
  const previous = paper.material.map;
  paper.material.map = printedPaper(print, maps, print.size[0], print.size[1], avatar);
  previous?.dispose();
}
