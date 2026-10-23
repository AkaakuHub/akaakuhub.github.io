import { CanvasTexture, SRGBColorSpace, Vector2 } from "three";
import type { PbrMaps } from "../library";
import { physicalSurface } from "../surface";

export function stationDisplay(plastic: PbrMaps) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("工具の表示を描画できませんでした。");
  context.fillStyle = "#0b1b13";
  context.fillRect(0, 0, 512, 256);
  context.fillStyle = "#c8d7ad";
  context.font = "500 112px monospace";
  context.textAlign = "center";
  context.fillText("350°C", 256, 166);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = plastic.map.anisotropy;
  return physicalSurface(plastic, {
    map,
    emissiveMap: map,
    emissive: "#c8d7ad",
    emissiveIntensity: 0.12,
    roughness: 0.25,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    normalScale: new Vector2(0.025, 0.025),
  });
}
