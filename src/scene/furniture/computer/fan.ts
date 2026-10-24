import { CylinderGeometry, ExtrudeGeometry, Group, Mesh, RingGeometry, Shape } from "three";
import type { Material } from "three";
import { box } from "../../primitives";

const outline = new Shape();
outline.moveTo(-0.006, 0.012);
outline.quadraticCurveTo(-0.023, 0.027, -0.017, 0.046);
outline.quadraticCurveTo(0.001, 0.052, 0.013, 0.044);
outline.quadraticCurveTo(-0.005, 0.035, 0.008, 0.014);
outline.closePath();
const bladeGeometry = new ExtrudeGeometry(outline, {
  depth: 0.002,
  bevelEnabled: false,
  curveSegments: 2,
});
const ringGeometry = new RingGeometry(0.049, 0.053, 24);
const hubGeometry = new CylinderGeometry(0.016, 0.016, 0.016, 16);

export function caseFan(frame: Material, blades: Material): Group {
  const fan = new Group();
  for (const side of [-1, 1]) {
    box(fan, [0.118, 0.006, 0.018], [0, side * 0.056, 0], frame);
    box(fan, [0.006, 0.106, 0.018], [side * 0.056, 0, 0], frame);
    box(fan, [0.012, 0.1, 0.003], [side * 0.028, 0, -0.008], frame);
  }
  fan.add(new Mesh(ringGeometry, frame));
  for (let index = 0; index < 7; index++) {
    const blade = new Mesh(bladeGeometry, blades);
    blade.rotation.z = (index * Math.PI * 2) / 7;
    fan.add(blade);
  }
  const hub = new Mesh(hubGeometry, frame);
  hub.rotation.x = Math.PI / 2;
  fan.add(hub);
  return fan;
}
