import type { PropMaterials } from "../materials/props";
import { Group, Mesh } from "three";
import type { Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { box } from "../primitives";
import { HardwareBatch, metricCylinderGeometry } from "../details/hardware";
import { metricBoxUv } from "../materials/uv";
import type { MetalMaterials } from "../materials/metal";

function roundBox(
  parent: Group,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
  radius: number,
): Mesh {
  const geometry = new RoundedBoxGeometry(...size, 3, radius);
  metricBoxUv(geometry);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function caster(
  parent: Group,
  hardware: HardwareBatch,
  x: number,
  z: number,
  frame: Material,
  rubber: Material,
): void {
  box(parent, [0.035, 0.07, 0.035], [x, 0.11, z], frame);
  for (const side of [-1, 1]) {
    box(parent, [0.008, 0.043, 0.046], [x + side * 0.021, 0.066, z], frame);
  }
  const wheel = new Mesh(metricCylinderGeometry(0.047, 0.032), rubber);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, 0.049, z);
  wheel.castShadow = true;
  wheel.receiveShadow = true;
  parent.add(wheel);
  const hub = metricCylinderGeometry(0.023, 0.034);
  hardware.add(hub, frame, [x, 0.049, z], [0, 0, Math.PI / 2]);
  for (const side of [-1, 1])
    hardware.bolt(frame, [x + side * 0.027, 0.049, z], [0, (side * Math.PI) / 2, 0]);
  hub.dispose();
}

export function createFrame(metals: MetalMaterials, props: PropMaterials): Group {
  const frame = new Group();
  const hardware = new HardwareBatch();
  const aluminum = metals.aluminum;
  const coating = metals.enamel;
  const rubber = metals.rubber;
  const backing = metals.ivory;
  const ceramic = metals.ivory.clone();
  ceramic.color.set("#f0f2e9");
  ceramic.roughness = 0.34;
  ceramic.normalScale.set(0.08, 0.08);
  ceramic.clearcoat = 0.58;
  ceramic.clearcoatRoughness = 0.3;
  roundBox(frame, [2.64, 1.36, 0.075], [0, 1.72, 0], aluminum, 0.026);
  roundBox(frame, [2.56, 1.28, 0.012], [0, 1.72, 0.039], ceramic, 0.014);
  box(frame, [2.5, 1.22, 0.015], [0, 1.72, -0.045], backing);
  for (const x of [-1.32, 1.32]) {
    roundBox(frame, [0.052, 1.67, 0.065], [x, 0.99, -0.012], coating, 0.012);
    roundBox(frame, [0.066, 0.056, 0.68], [x, 0.153, 0], coating, 0.014);
    for (const z of [-0.285, 0.285]) caster(frame, hardware, x, z, aluminum, rubber);
    const knob = metricCylinderGeometry(0.045, 0.065, 96);
    const positions = knob.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      const grip = 1 + Math.cos(Math.atan2(z, x) * 12) * 0.035;
      positions.setXYZ(index, x * grip, positions.getY(index), z * grip);
    }
    knob.computeVertexNormals();
    const pivot = new Mesh(knob, coating);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(x, 1.72, 0);
    pivot.castShadow = true;
    frame.add(pivot);
    const side = Math.sign(x);
    hardware.bolt(aluminum, [x + side * 0.034, 1.72, 0], [0, (side * Math.PI) / 2, 0]);
    for (const y of [0.24, 0.42, 1.18]) hardware.bolt(aluminum, [x, y, 0.022]);
    for (const z of [-0.338, 0.338])
      roundBox(frame, [0.069, 0.058, 0.014], [x, 0.153, z], rubber, 0.005);
    const cap = roundBox(frame, [0.055, 0.008, 0.068], [x, 1.828, -0.012], rubber, 0.004);
    cap.name = "stand-tube-endcap";
    const brace = box(frame, [0.026, 0.78, 0.027], [x, 0.54, -0.13], coating);
    brace.rotation.x = -0.3;
  }
  box(frame, [2.56, 0.035, 0.035], [0, 0.42, -0.06], coating);
  roundBox(frame, [1.78, 0.025, 0.13], [0.15, 1.025, 0.08], aluminum, 0.008);
  box(frame, [1.78, 0.035, 0.012], [0.15, 1.035, 0.142], coating);
  for (const x of [-0.61, 0.91]) hardware.screw(aluminum, [x, 1.023, 0.149]);
  for (const x of [-1.302, 1.302])
    for (const y of [1.1, 2.34]) hardware.screw(aluminum, [x, y, 0.0385]);
  const eraser = new Group();
  eraser.position.set(0.76, 1.0375, 0.075);
  eraser.rotation.y = -0.12;
  roundBox(eraser, [0.145, 0.009, 0.067], [0, 0.0045, 0], props.felt, 0.002);
  roundBox(eraser, [0.145, 0.026, 0.067], [0, 0.022, 0], props.plasticGraphite, 0.006);
  for (const z of [-0.016, 0, 0.016])
    roundBox(eraser, [0.1, 0.001, 0.003], [0, 0.0355, z], props.plasticGraphite, 0.0004);
  frame.add(eraser);
  for (const [index, color] of ["#6c4036", "#314c55"].entries()) {
    const marker = new Mesh(metricCylinderGeometry(0.009, 0.145, 12), props.plasticIvory);
    marker.rotation.z = Math.PI / 2;
    marker.position.set(0.41 - index * 0.22, 1.048, 0.08);
    marker.castShadow = true;
    frame.add(marker);
    const cap = props.plasticIvory.clone();
    cap.color.set(color);
    box(frame, [0.035, 0.019, 0.019], [marker.position.x + 0.058, 1.048, 0.08], cap);
  }
  hardware.finish(frame);
  return frame;
}
