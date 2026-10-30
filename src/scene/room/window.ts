import type { PropMaterials } from "../materials/props";
import type { MetalMaterials } from "../materials/metal";
import type { PbrMaps } from "../materials/library";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { box } from "../primitives";
import { HardwareBatch } from "../details/hardware";
import { createWindowPanels } from "./window-panels";
import { createCurtains } from "./curtains";
import type { ArchitectureMaterials } from "./materials/architecture";
import { chamferedBox } from "../geometry/chamfered-box";
import { createExterior } from "./exterior";

export function createWindow(
  materials: ArchitectureMaterials,
  fabric: PbrMaps,
  metals: MetalMaterials,
  props: Pick<PropMaterials, "glass" | "paper">,
): Group {
  const window = new Group();
  const exit = new Mesh(
    new BoxGeometry(1.8, 1.06, 0.12),
    new MeshBasicMaterial({ visible: false }),
  );
  exit.name = "room-window-exit";
  exit.position.set(-2.695, 1.61675, 0.94);
  exit.rotation.y = Math.PI / 2;
  exit.visible = false;
  window.add(exit);
  const frame = materials.frame;
  const steel = metals.steel;
  const hardware = new HardwareBatch();
  const sill = materials.sill;
  window.add(createExterior(materials, metals, props));
  const panels = createWindowPanels(frame, metals.rubber, props.glass, steel);
  window.add(panels.group);
  for (const y of [1.02, 2.55]) {
    chamferedBox(window, [0.16, 0.075, 3.93], [-2.57, y, 0], frame, 0.0006);
  }
  for (const z of [-1.93, 1.93]) {
    const mullion = chamferedBox(window, [0.14, 1.6, 0.055], [-2.57, 1.785, z], frame, 0.0006);
    mullion.name = "room-window-mullion";
    for (const y of [1.075, 2.49]) hardware.screw(steel, [-2.4999, y, z], [0, Math.PI / 2, 0]);
  }
  for (const z of [-0.18, 1.08])
    chamferedBox(window, [0.14, 0.32, 0.055], [-2.57, 2.365, z], frame, 0.0006);
  chamferedBox(window, [0.32, 0.055, 4.13], [-2.43, 0.965, 0], sill, 0.0015);
  chamferedBox(window, [0.055, 0.115, 4.1], [-2.31, 0.9, 0], sill, 0.001);
  for (const x of [-2.546, -2.626]) box(window, [0.002, 0.006, 3.78], [x, 1.0605, 0], steel);
  hardware.finish(window);
  const dust = props.paper.clone();
  dust.color.set("#8a8170");
  box(window, [0.018, 0.004, 3.82], [-2.53, 0.996, 0], dust);
  window.add(createCurtains(fabric, metals));
  return window;
}
