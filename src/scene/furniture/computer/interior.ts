import {
  CanvasTexture,
  CatmullRomCurve3,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import type { Material } from "three";
import { box } from "../../primitives";
import { roundBox } from "../geometry";
import { caseFan } from "./fan";

function wire(
  parent: Group,
  points: readonly [number, number, number][],
  radius: number,
  material: Material,
) {
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
  parent.add(new Mesh(new TubeGeometry(curve, 24, radius, 6, false), material));
}

function gpuLabel(): Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("GPUの表示を描画できません。");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#75c9ff";
  context.font = "700 62px sans-serif";
  context.fillText("AERO", 25, 70);
  context.fillStyle = "#777b7b";
  context.font = "600 43px sans-serif";
  context.fillText("GEFORCE RTX", 540, 68);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const label = new Mesh(
    new PlaneGeometry(0.3, 0.028),
    new MeshStandardMaterial({
      map,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      emissive: "#ffffff",
      emissiveMap: map,
      emissiveIntensity: 0.45,
    }),
  );
  label.rotation.y = -Math.PI / 2;
  label.position.set(-0.081, 0.155, -0.01);
  return label;
}

export function computerInterior(white: Material, metal: Material, dark: Material): Group {
  const interior = new Group();
  box(interior, [0.008, 0.275, 0.275], [0.087, 0.285, -0.045], dark);
  for (const z of [-0.164, -0.139, -0.114])
    box(interior, [0.027, 0.23, 0.016], [0.069, 0.299, z], metal);
  for (const z of [0.018, 0.031, 0.044, 0.057])
    roundBox(interior, [0.024, 0.22, 0.007], [0.066, 0.3, z], white, 0.002);
  roundBox(interior, [0.027, 0.067, 0.067], [0.06, 0.316, -0.06], white, 0.012);
  box(interior, [0.022, 0.018, 0.09], [0.066, 0.215, -0.09], metal);
  box(interior, [0.155, 0.004, 0.326], [0.002, 0.182, -0.01], white);
  box(interior, [0.151, 0.04, 0.316], [0.002, 0.158, -0.01], dark);
  for (let index = 0; index < 70; index++)
    box(interior, [0.15, 0.038, 0.001], [0.002, 0.158, -0.162 + index * 0.0044], metal);
  for (const y of [0.134, 0.18]) box(interior, [0.006, 0.007, 0.326], [-0.078, y, -0.01], white);
  interior.add(gpuLabel());
  for (const offset of [-0.01, 0.01])
    wire(
      interior,
      [
        [0.032, 0.294, -0.06 + offset],
        [-0.022, 0.245, 0.01 + offset],
        [-0.043, 0.29, 0.112 + offset],
        [-0.022, 0.415, 0.122 + offset],
      ],
      0.006,
      white,
    );
  for (let index = 0; index < 8; index++) {
    const z = 0.016 + index * 0.003;
    wire(
      interior,
      [
        [-0.045, 0.184, z],
        [-0.062, 0.222, z + 0.006],
        [0.01, 0.238, z + 0.065],
        [0.078, 0.17, z + 0.073],
      ],
      0.0012,
      white,
    );
  }
  box(interior, [0.15, 0.02, 0.365], [0, 0.448, 0], dark);
  for (const z of [-0.12, 0, 0.12]) {
    const fan = caseFan(white, white);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 0.429, z);
    interior.add(fan);
  }
  const rear = caseFan(white, white);
  rear.position.set(0, 0.332, -0.197);
  rear.rotation.y = Math.PI;
  interior.add(rear);
  return interior;
}
