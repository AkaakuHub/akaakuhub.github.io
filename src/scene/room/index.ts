import type { PropMaterials } from "../materials/props";
import { Group, Mesh, Vector3 } from "three";
import type { MaterialLibrary } from "../materials/library";
import type { MetalMaterials } from "../materials/metal";
import { box } from "../primitives";
import { createCeiling } from "./ceiling";
import { createDoor } from "./door";
import { createArchitectureMaterials } from "./materials/architecture";
import { createWindow } from "./window";
import { wallBlock } from "./wall";
import { orientWoodGrain } from "../materials/wood-grain";
import { chamferedBox } from "../geometry/chamfered-box";

export function createRoom(
  maps: MaterialLibrary,
  metals: MetalMaterials,
  props: PropMaterials,
): Group {
  const materials = createArchitectureMaterials(maps);
  const room = new Group();
  room.name = "clubroom-architecture";
  box(room, [5.4, 0.12, 5.4], [0, -0.06, 0], materials.floor);
  const wall = materials.wall;
  for (const z of [-2.67, 2.67]) {
    wallBlock(room, [5.4, 2.9, 0.14], [0, 1.45, z], wall);
  }
  wallBlock(room, [0.14, 2.9, 3.08], [2.67, 1.45, -1.16], wall);
  wallBlock(room, [0.14, 2.9, 1.2], [2.67, 1.45, 2.1], wall);
  wallBlock(room, [0.14, 0.65, 1.12], [2.67, 2.575, 0.95], wall);
  wallBlock(room, [0.1, 2.9, 1.7], [3.35, 1.45, 0.95], wall);
  wallBlock(room, [0.14, 0.98, 5.4], [-2.67, 0.49, 0], wall);
  wallBlock(room, [0.14, 0.35, 5.4], [-2.67, 2.725, 0], wall);
  for (const z of [-2.3, 2.3]) {
    wallBlock(room, [0.14, 1.57, 0.74], [-2.67, 1.765, z], wall);
  }
  const boards = materials.boards;
  const trim = materials.trim;
  for (const z of [-2.586, 2.586]) {
    for (let panel = 0; panel < 8; panel++)
      orientWoodGrain(
        box(room, [0.6485, 0.84, 0.012], [-2.275 + panel * 0.65, 0.42, z], boards),
        "y",
        "v",
      );
    chamferedBox(room, [5.2, 0.07, 0.05], [0, 0.043, z - Math.sign(z) * 0.015], trim, 0.001);
    chamferedBox(room, [5.2, 0.038, 0.065], [0, 0.862, z - Math.sign(z) * 0.017], trim, 0.001);
    chamferedBox(room, [5.2, 0.058, 0.045], [0, 2.724, z - Math.sign(z) * 0.012], trim, 0.001);
  }
  for (const x of [-2.586, 2.586]) {
    const spans =
      x > 0
        ? ([
            [-2.6, 0.39],
            [1.51, 2.6],
          ] as const)
        : ([[-2.6, 2.6]] as const);
    for (const [start, end] of spans) {
      for (let panel = 0; panel < 8; panel++) {
        const center = -2.275 + panel * 0.65;
        const left = Math.max(start, center - 0.6485 / 2);
        const right = Math.min(end, center + 0.6485 / 2);
        if (right <= left) continue;
        orientWoodGrain(
          box(room, [0.012, 0.84, right - left], [x, 0.42, (left + right) / 2], boards),
          "y",
          "v",
        );
      }
      const length = end - start;
      const center = (start + end) / 2;
      chamferedBox(
        room,
        [0.05, 0.07, length],
        [x - Math.sign(x) * 0.015, 0.043, center],
        trim,
        0.001,
      );
      chamferedBox(
        room,
        [0.065, 0.038, length],
        [x - Math.sign(x) * 0.017, 0.862, center],
        trim,
        0.001,
      );
    }
    chamferedBox(room, [0.045, 0.058, 5.2], [x - Math.sign(x) * 0.012, 2.724, 0], trim, 0.001);
  }
  for (const x of [-2.535, 2.535]) {
    for (const z of [-2.535, 2.535]) {
      wallBlock(room, [0.13, 2.9, 0.13], [x, 1.45, z], wall);
      orientWoodGrain(box(room, [0.145, 0.9, 0.145], [x, 0.45, z], boards), "y", "v");
      chamferedBox(room, [0.155, 0.06, 0.155], [x, 0.87, z], trim, 0.0008);
    }
  }
  room.add(
    createCeiling(materials, metals),
    createWindow(materials, maps.fabric, metals, props),
    createDoor(materials, metals, props),
  );
  const size = new Vector3();
  room.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (object.material !== trim && object.material !== materials.sill) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox) throw new Error("木製の見切りの寸法を確認できません。");
    object.geometry.boundingBox.getSize(size);
    const axis = size.y > size.x && size.y > size.z ? "y" : size.z > size.x ? "z" : "x";
    orientWoodGrain(object, axis, "v");
  });
  return room;
}
