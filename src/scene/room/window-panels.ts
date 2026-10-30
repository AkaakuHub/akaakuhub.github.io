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
  const hitArea = new Mesh(new BoxGeometry(0.08, 1.1, 1.86), new MeshBasicMaterial());
  hitArea.name = "room-window-hit-area";
  hitArea.position.set(-2.52, 1.61675, 0.94);
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
    for (const edge of [-width / 2 + 0.018, width / 2 - 0.018])
      box(group, [0.075, 0.321, 0.018], [-2.572, 2.3645, center + edge], gasket);
  }
  const transom = chamferedBox(group, [0.14, 0.04, 3.86], [-2.57, 2.196, 0], frame, 0.0006);
  transom.name = "room-window-transom";
  for (const [parent, center, x] of [
    [group, -0.94, -2.626],
    [sash, 0.94, -2.546],
  ] as const) {
    const lower = box(parent, [0.008, 1.071, 1.812], [x, 1.61675, center], glass);
    lower.name = "room-window-lower-pane";
    lower.castShadow = lower.receiveShadow = false;
    for (const y of [1.0695, 2.164]) {
      const rail = chamferedBox(parent, [0.04, 0.024, 1.9], [x, y, center], frame, 0.0006);
      rail.name = "room-window-sash-rail";
      box(
        parent,
        [0.012, 0.009, 1.84],
        [x + 0.005, y + (y < 1.6 ? 0.015 : -0.015), center],
        gasket,
      );
    }
    for (const edge of [-0.934, 0.934]) {
      const stile = chamferedBox(
        parent,
        [0.04, 1.1185, 0.032],
        [x, 1.61675, center + edge],
        frame,
        0.0006,
      );
      stile.name = "room-window-sash-stile";
      box(
        parent,
        [0.012, 1.071, 0.009],
        [x + 0.005, 1.61675, center + edge - Math.sign(edge) * 0.021],
        gasket,
      );
    }
  }
  const handle = windowPull(steel);
  handle.position.set(-2.4999, 1.65, 1.82);
  handle.rotation.y = Math.PI / 2;
  sash.add(handle);
  return { group, sash };
}

export function slideWindow(sash: Group, amount: number): void {
  sash.position.set(0, 0, -1.88 * amount);
}
