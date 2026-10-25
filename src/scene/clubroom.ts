import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import type { Object3D, Scene } from "three";
import { createBoard } from "./board";
import { createFurniture } from "./furniture";
import type { MaterialLibrary } from "./materials/library";
import { createMetalMaterials } from "./materials/metal";
import { createPropMaterials } from "./materials/props";
import { createRoom } from "./room";
import { batchStaticMeshes } from "./static-batches";
import { createComputerInspection } from "./view/computer";

export function assembleClubroom(
  scene: Scene,
  materials: MaterialLibrary,
  skillAtlas: ImageBitmap,
) {
  const metals = createMetalMaterials(materials);
  const props = createPropMaterials(materials);
  const board = createBoard(metals, materials.paper, props, skillAtlas);
  scene.add(
    createRoom(materials, metals, props),
    createFurniture(materials, metals, props),
    board.group,
  );
  const lightSwitch = scene.getObjectByName("room-light-switch");
  const rocker = scene.getObjectByName("room-light-switch-rocker");
  if (!lightSwitch || !rocker) throw new Error("部屋の照明スイッチが見つかりません。");
  const computer = createComputerInspection(scene);
  const power = scene.getObjectByName("computer-power-button");
  const monitor = scene.getObjectByName("computer-monitor");
  if (
    !(power instanceof Mesh) ||
    !(power.material instanceof MeshStandardMaterial) ||
    !(monitor instanceof Mesh) ||
    !(monitor.material instanceof MeshBasicMaterial)
  )
    throw new Error("PCの電源とモニターが見つかりません。");
  const fans = scene
    .getObjectsByProperty("name", "computer-fan-rotor")
    .filter((object): object is Group => object instanceof Group);
  if (fans.length === 0) throw new Error("PCファンが見つかりません。");
  const fanSurfaces: Mesh[] = [];
  const preserved = new Set<Object3D>([
    ...board.notices.keys(),
    ...board.dynamicObjects,
    lightSwitch,
    rocker,
    computer.object,
    power,
    monitor,
  ]);
  for (const fan of fans)
    fan.traverse((object) => {
      preserved.add(object);
      if (object instanceof Mesh) fanSurfaces.push(object);
    });
  batchStaticMeshes(scene, preserved);
  return {
    board,
    lightSwitch,
    rocker,
    computer: { ...computer, power, monitor, fans, fanSurfaces },
  };
}
