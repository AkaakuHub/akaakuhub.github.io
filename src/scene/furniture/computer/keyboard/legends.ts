import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { keyTransform, pitch, topHeight } from "./keycap";
import type { Key } from "./layout";

export function keyLegends(keys: readonly Key[]): Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("キーの刻印を描画できません。");
  context.fillStyle = "#90958f";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const parts = keys.map((key, index) => {
    const column = index % 16;
    const row = Math.floor(index / 16);
    context.font = `${key.label.length > 2 ? 12 : 18}px sans-serif`;
    context.fillText(key.label, column * 64 + 32, row * 64 + 32, 58);
    const width = Math.min(key.units, 1.5) * pitch * 0.68;
    const depth = pitch * 0.55;
    const geometry = new PlaneGeometry(width, depth, 4, 2).rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    for (let vertex = 0; vertex < positions.count; vertex++)
      positions.setY(
        vertex,
        topHeight(key, positions.getX(vertex), positions.getZ(vertex)) + 0.00004,
      );
    const uv = geometry.getAttribute("uv");
    for (let vertex = 0; vertex < uv.count; vertex++)
      uv.setXY(vertex, (column + uv.getX(vertex)) / 16, 1 - (row + 1 - uv.getY(vertex)) / 8);
    geometry.computeVertexNormals();
    return geometry.applyMatrix4(keyTransform(key));
  });
  const geometry = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!geometry) throw new Error("キーの刻印をまとめられません。");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshStandardMaterial({ map: texture, roughness: 0.85, alphaTest: 0.15 });
  return new Mesh(geometry, material);
}
