import { CylinderGeometry, Group, Mesh, SphereGeometry, TorusGeometry } from "three";
import type { Material } from "three";
import { box } from "../../primitives";

export function caseFan(frame: Material, blades: Material): Group {
  const fan = new Group();
  for (const side of [-1, 1]) {
    box(fan, [0.118, 0.006, 0.018], [0, side * 0.056, 0], frame);
    box(fan, [0.006, 0.106, 0.018], [side * 0.056, 0, 0], frame);
  }
  fan.add(new Mesh(new TorusGeometry(0.052, 0.003, 6, 32), frame));
  const bladeGeometry = new SphereGeometry(1, 10, 6);
  for (let index = 0; index < 7; index++) {
    const angle = (index * Math.PI * 2) / 7;
    const blade = new Mesh(bladeGeometry, blades);
    blade.scale.set(0.013, 0.027, 0.003);
    blade.position.set(Math.sin(angle) * 0.027, Math.cos(angle) * 0.027, 0);
    blade.rotation.set(0.28, 0, -angle - 0.48);
    fan.add(blade);
  }
  const hub = new Mesh(new CylinderGeometry(0.016, 0.016, 0.016, 24), frame);
  hub.rotation.x = Math.PI / 2;
  fan.add(hub);
  return fan;
}
