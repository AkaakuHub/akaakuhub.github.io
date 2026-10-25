import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from "three";
import type { Object3D, Scene } from "three";
import { createBoard } from "./board";
import { createFurniture } from "./furniture";
import type { MaterialLibrary } from "./materials/library";
import { createMetalMaterials } from "./materials/metal";
import { createPropMaterials } from "./materials/props";
import { createRoom } from "./room";
import { batchStaticMeshes } from "./static-batches";
import { createComputerInspection } from "./view/computer";
import { createDisplayOrientation } from "./furniture/computer/orientation";

function isMonitor(object: Object3D | undefined): object is Mesh<PlaneGeometry, MeshBasicMaterial> {
  return (
    object instanceof Mesh &&
    object.geometry instanceof PlaneGeometry &&
    object.material instanceof MeshBasicMaterial
  );
}

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
  const power = scene.getObjectByName("computer-power-button");
  const monitor = scene.getObjectByName("computer-monitor");
  const head = scene.getObjectByName("computer-display-head");
  if (
    !(power instanceof Mesh) ||
    !(power.material instanceof MeshStandardMaterial) ||
    !isMonitor(monitor) ||
    !(head instanceof Group)
  )
    throw new Error("PCの電源とモニターが見つかりません。");
  const orientDisplay = createDisplayOrientation(head, monitor);
  orientDisplay(window.innerHeight > window.innerWidth);
  const computer = createComputerInspection(scene);
  const fans = scene
    .getObjectsByProperty("name", "computer-fan-rotor")
    .filter((object): object is Group => object instanceof Group);
  if (fans.length === 0) throw new Error("PCファンが見つかりません。");
  const fanSurfaces: Mesh[] = [];
  const preserved = new Set<Object3D>([
    ...board.notices.keys(),
    lightSwitch,
    rocker,
    computer.object,
    power,
    monitor,
  ]);
  head.traverse((object) => preserved.add(object));
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
    computer: Object.assign(computer, { power, monitor, fans, fanSurfaces, orientDisplay }),
  };
}
