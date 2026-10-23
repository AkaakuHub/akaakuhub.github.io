import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import { surface } from "../primitives";

function desktop(): MeshStandardMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("机のテクスチャを作成できませんでした。");
  context.fillStyle = "#b49a72";
  context.fillRect(0, 0, 512, 512);
  for (let line = 0; line < 180; line++) {
    const height = (line * 59) % 512;
    context.strokeStyle = `rgba(67, 47, 25, ${0.025 + (line % 5) * 0.008})`;
    context.lineWidth = 0.5 + (line % 3) * 0.3;
    context.beginPath();
    context.moveTo(0, height);
    context.bezierCurveTo(160, height - 6, 310, height + 7, 512, height - 1);
    context.stroke();
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  return new MeshStandardMaterial({ map, roughness: 0.48, bumpMap: map, bumpScale: 0.0006 });
}

export function createFurnitureMaterials() {
  return {
    desktop: desktop(),
    edging: surface("#625342", 0.58),
    steel: surface("#9a9b96", 0.34, 0.72),
    darkSteel: surface("#454a48", 0.43, 0.6),
    rubber: surface("#292d2b", 0.96),
    chair: surface("#566c6d", 0.71),
    cabinet: surface("#a4aaa0", 0.68, 0.32),
    shelf: surface("#8a897b", 0.7, 0.2),
    paper: surface("#e7e3d8", 0.95),
    cardboard: surface("#9b7c55", 0.98),
    tape: surface("#b8a582", 0.62),
    black: surface("#262b29", 0.6),
    terracotta: surface("#996852", 0.88),
    green: surface("#566e3c", 0.83),
  };
}

export type FurnitureMaterials = ReturnType<typeof createFurnitureMaterials>;
