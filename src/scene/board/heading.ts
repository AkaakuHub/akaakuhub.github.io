import { textureFromCanvas } from "../materials/printed-texture";
import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three";

export function createBoardHeading(text: string, x: number, y: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("ホワイトボードの見出しを描画できませんでした。");
  context.font = '400 176px "Yomogi"';
  context.fillStyle = "#284a40";
  const metrics = context.measureText(text);
  context.fillText(text, 36, 160 - metrics.actualBoundingBoxDescent);
  const texture = textureFromCanvas(context);
  texture.anisotropy = 8;
  const heading = new Mesh(
    new PlaneGeometry(0.65, 0.1625),
    new MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  heading.position.set(x, y, 0.0451);
  heading.rotation.z = -0.012;
  heading.receiveShadow = true;
  return heading;
}

export function createBoardCredit() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("ホワイトボードのクレジットを描画できませんでした。");
  context.font = '400 73px "Yomogi"';
  context.fillStyle = "#53645c";
  context.fillText("Weather by Open-Meteo", 18, 88);
  const texture = textureFromCanvas(context);
  const credit = new Mesh(
    new PlaneGeometry(0.56, 0.07),
    new MeshStandardMaterial({ map: texture, transparent: true, depthWrite: false, roughness: 1 }),
  );
  credit.scale.set(1.15, 0.72, 1);
  credit.position.set(0.9, 0.68, 0.0451);
  return credit;
}
