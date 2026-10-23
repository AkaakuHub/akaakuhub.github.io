import { CylinderGeometry, Group, Mesh, MeshPhysicalMaterial } from "three";
import type { Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { box, surface } from "../primitives";

function roundBox(
  parent: Group,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
  radius: number,
): Mesh {
  const mesh = new Mesh(new RoundedBoxGeometry(...size, 3, radius), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function caster(parent: Group, x: number, z: number, frame: Material, rubber: Material): void {
  box(parent, [0.035, 0.07, 0.035], [x, 0.11, z], frame);
  for (const side of [-1, 1]) {
    box(parent, [0.008, 0.043, 0.046], [x + side * 0.021, 0.066, z], frame);
  }
  const wheel = new Mesh(new CylinderGeometry(0.047, 0.047, 0.032, 18), rubber);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, 0.049, z);
  wheel.castShadow = true;
  wheel.receiveShadow = true;
  parent.add(wheel);
  const axle = new Mesh(new CylinderGeometry(0.013, 0.013, 0.052, 12), frame);
  axle.rotation.z = Math.PI / 2;
  axle.position.copy(wheel.position);
  parent.add(axle);
}

export function createFrame(): Group {
  const frame = new Group();
  const aluminum = surface("#adb5b0", 0.39, 0.82);
  const coating = surface("#657a70", 0.53, 0.12);
  const rubber = surface("#333b38", 0.94);
  const backing = surface("#b2b9ae", 0.87);
  const ceramic = new MeshPhysicalMaterial({
    color: "#f0f2e9",
    roughness: 0.3,
    clearcoat: 0.58,
    clearcoatRoughness: 0.3,
  });
  roundBox(frame, [2.64, 1.36, 0.075], [0, 1.72, 0], aluminum, 0.026);
  roundBox(frame, [2.56, 1.28, 0.012], [0, 1.72, 0.039], ceramic, 0.014);
  box(frame, [2.5, 1.22, 0.015], [0, 1.72, -0.045], backing);
  for (const x of [-1.32, 1.32]) {
    roundBox(frame, [0.052, 1.67, 0.065], [x, 0.99, -0.012], coating, 0.012);
    roundBox(frame, [0.066, 0.056, 0.68], [x, 0.153, 0], coating, 0.014);
    for (const z of [-0.285, 0.285]) caster(frame, x, z, aluminum, rubber);
    const pivot = new Mesh(new CylinderGeometry(0.058, 0.058, 0.065, 20), coating);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(x, 1.72, 0);
    pivot.castShadow = true;
    frame.add(pivot);
    const brace = box(frame, [0.026, 0.78, 0.027], [x, 0.54, -0.13], coating);
    brace.rotation.x = -0.3;
  }
  box(frame, [2.56, 0.035, 0.035], [0, 0.42, -0.06], coating);
  roundBox(frame, [1.78, 0.025, 0.13], [0.15, 1.025, 0.08], aluminum, 0.008);
  box(frame, [1.78, 0.035, 0.012], [0.15, 1.035, 0.142], coating);
  const eraser = roundBox(frame, [0.145, 0.035, 0.067], [0.76, 1.055, 0.075], coating, 0.01);
  eraser.rotation.y = -0.12;
  for (const [index, color] of ["#6c4036", "#314c55"].entries()) {
    const marker = new Mesh(
      new CylinderGeometry(0.009, 0.009, 0.145, 12),
      surface("#dedfd4", 0.65),
    );
    marker.rotation.z = Math.PI / 2;
    marker.position.set(0.41 - index * 0.22, 1.048, 0.08);
    marker.castShadow = true;
    frame.add(marker);
    box(
      frame,
      [0.035, 0.019, 0.019],
      [marker.position.x + 0.058, 1.048, 0.08],
      surface(color, 0.5),
    );
  }
  return frame;
}
