import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import type { Material } from "three";
import { box } from "../primitives";
import { chamferedBox } from "../geometry/chamfered-box";
import { windowPull } from "../details/pull";

export function createWindowPanels(
  frame: Material,
  gasket: Material,
  glass: Material,
  steel: Material,
) {
  const group = new Group();
  const sash = new Group();
  sash.name = "room-window-sash";
  group.add(sash);
  const hitArea = new Mesh(new BoxGeometry(0.16, 1.2, 1.26), new MeshBasicMaterial());
  hitArea.name = "room-window-hit-area";
  hitArea.position.set(-2.51, 1.61, 0.45);
  hitArea.visible = false;
  sash.add(hitArea);
  for (const [center, width] of [
    [-1.055, 1.75],
    [0.45, 1.26],
    [1.505, 0.85],
  ] as const) {
    const upper = box(group, [0.008, 0.321, width - 0.02], [-2.626, 2.3645, center], glass);
    upper.name = "room-window-upper-pane";
    upper.castShadow = upper.receiveShadow = false;
    const parent = center === 0.45 ? sash : group;
    const lower = box(
      parent,
      [0.008, center === 0.45 ? 1.095 : 1.131, center === 0.45 ? 1.18 : width - 0.02],
      [-2.626, center === 0.45 ? 1.61675 : 1.6105, center],
      glass,
    );
    lower.name = "room-window-lower-pane";
    lower.castShadow = lower.receiveShadow = false;
    for (const edge of [-width / 2 + 0.018, width / 2 - 0.018])
      box(group, [0.075, 1.46, 0.018], [-2.572, 1.785, center + edge], gasket);
    const transom = chamferedBox(
      group,
      [0.07, 0.028, width - 0.04],
      [-2.568, 2.19, center],
      frame,
      0.0006,
    );
    transom.name = "room-window-transom";
    const handle = windowPull(steel);
    handle.position.set(-2.4999, 1.65, center + width / 2 - 0.06);
    handle.rotation.y = Math.PI / 2;
    parent.add(handle);
  }
  for (const y of [1.0655, 2.168]) {
    const rail = chamferedBox(sash, [0.04, 0.016, 1.205], [-2.611, y, 0.45], frame, 0.0006);
    rail.name = "room-window-sash-rail";
  }
  for (const z of [-0.1445, 1.0445]) {
    const stile = chamferedBox(sash, [0.04, 1.1185, 0.016], [-2.611, 1.61675, z], frame, 0.0006);
    stile.name = "room-window-sash-stile";
  }
  return { group, sash };
}

export function slideWindow(sash: Group, amount: number): void {
  sash.position.set(0.02 * amount, 0, -1.28 * amount);
}
