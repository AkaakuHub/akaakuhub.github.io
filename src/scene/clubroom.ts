import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from "three";
import type { Object3D, Scene } from "three";
import { createBoard } from "./board";
import type { PaperPrinter } from "./board/printing";
import { createFurniture } from "./furniture";
import type { MaterialLibrary } from "./materials/library";
import { createMetalMaterials } from "./materials/metal";
import { createPropMaterials } from "./materials/props";
import { createRoom } from "./room";
import { createComputerInspection } from "./view/computer";
import { createDisplayOrientation } from "./furniture/computer/orientation";

function isMonitor(object: Object3D | undefined): object is Mesh<PlaneGeometry, MeshBasicMaterial> {
  return (
    object instanceof Mesh &&
    object.geometry instanceof PlaneGeometry &&
    object.material instanceof MeshBasicMaterial
  );
}

export async function assembleClubroom(
  scene: Scene,
  materials: MaterialLibrary,
  avatar: ImageBitmap,
  batchStaticMeshes: (scene: Scene, preserved: ReadonlySet<Object3D>) => Promise<void>,
  printer: PaperPrinter,
) {
  const metals = createMetalMaterials(materials);
  const props = createPropMaterials(materials);
  performance.mark("room-paper-start");
  const boardReady = createBoard(metals, materials.paper, props, avatar, printer);
  scene.add(createRoom(materials, metals, props), createFurniture(materials, metals, props));
  performance.mark("room-models-ready");
  const board = await boardReady;
  performance.mark("room-paper-ready");
  scene.add(board.group);
  const lightSwitch = scene.getObjectByName("room-light-switch");
  const rocker = scene.getObjectByName("room-light-switch-rocker");
  if (!lightSwitch || !rocker) throw new Error("部屋の照明スイッチが見つかりません。");
  const pivot = scene.getObjectByName("room-door-pivot");
  const leaf = scene.getObjectByName("room-door-leaf");
  const doorLight = scene.getObjectByName("room-door-light");
  if (!(pivot instanceof Group) || !(leaf instanceof Group) || !(doorLight instanceof Mesh))
    throw new Error("ドアの可動部と光が見つかりません。");
  const door = { pivot, leaf, light: doorLight };
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
    pivot,
    doorLight,
    lightSwitch,
    rocker,
    computer.object,
    ...computer.surfaces,
    power,
    monitor,
  ]);
  leaf.traverse((object) => preserved.add(object));
  lightSwitch.traverse((object) => preserved.add(object));
  head.traverse((object) => preserved.add(object));
  for (const fan of fans)
    fan.traverse((object) => {
      preserved.add(object);
      if (object instanceof Mesh) fanSurfaces.push(object);
    });
  performance.mark("room-batching-start");
  await batchStaticMeshes(scene, preserved);
  performance.mark("room-batching-ready");
  return {
    board,
    door,
    lightSwitch,
    rocker,
    computer: Object.assign(computer, { power, monitor, fans, fanSurfaces, orientDisplay }),
  };
}
