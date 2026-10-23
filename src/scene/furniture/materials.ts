import {
  CanvasTexture,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { surface } from "../primitives";

function grain(base: string, dark: string, roughness: number): MeshStandardMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("家具の材質を描画できませんでした。");
  context.fillStyle = base;
  context.fillRect(0, 0, 512, 512);
  context.strokeStyle = dark;
  for (let index = 0; index < 270; index++) {
    const y = index * 1.94;
    context.globalAlpha = 0.025 + (index % 13) * 0.003;
    context.lineWidth = 0.35 + (index % 7) * 0.12;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(120, y + Math.sin(index * 0.17) * 13, 390, y - 9, 512, y + 3);
    context.stroke();
  }
  context.globalAlpha = 0.12;
  for (let index = 0; index < 9; index++) {
    context.beginPath();
    context.ellipse(90 + index * 61, 50 + ((index * 173) % 400), 25, 1.6, 0.1, 0, Math.PI * 2);
    context.stroke();
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.anisotropy = 8;
  return new MeshStandardMaterial({ map, roughness, bumpMap: map, bumpScale: 0.0008 });
}

function paintTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("塗装面の材質を描画できませんでした。");
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const value = 218 + ((x * 17 + y * 31 + ((x * y) % 47)) % 29);
      context.fillStyle = `rgb(${value},${value},${value})`;
      context.fillRect(x, y, 1, 1);
    }
  }
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(3, 3);
  return map;
}

export function createFurnitureMaterials() {
  const microSurface = paintTexture();
  const paint = (color: string, roughness: number, metalness = 0) =>
    new MeshStandardMaterial({
      color,
      roughness,
      metalness,
      roughnessMap: microSurface,
      bumpMap: microSurface,
      bumpScale: 0.00025,
    });
  return {
    ash: grain("#c9b283", "#534633", 0.48),
    walnut: grain("#69513b", "#241b15", 0.56),
    amber: grain("#b8843e", "#5b3c25", 0.31),
    ivory: paint("#e0dfd2", 0.72),
    enamel: paint("#6a786c", 0.46, 0.22),
    deepGreen: paint("#3d514c", 0.52, 0.25),
    metal: surface("#a8aaa3", 0.28, 0.85),
    brass: surface("#a59057", 0.35, 0.78),
    graphite: paint("#323a39", 0.65),
    rubber: surface("#272b28", 0.97),
    paper: surface("#eae3cf", 0.94),
    terracotta: surface("#a97055", 0.89),
    foliage: surface("#5c714e", 0.86),
    navy: surface("#526371", 0.82),
    rust: surface("#9f634f", 0.85),
    mustard: surface("#b49b5c", 0.88),
    glass: new MeshPhysicalMaterial({
      color: "#dce9df",
      roughness: 0.065,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.006,
      ior: 1.52,
      transparent: true,
      depthWrite: false,
    }),
    mirror: new MeshStandardMaterial({ color: "#b9cecc", roughness: 0.055, metalness: 1 }),
  };
}

export type FurnitureMaterials = ReturnType<typeof createFurnitureMaterials>;
