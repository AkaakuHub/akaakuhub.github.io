import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import type { Scene } from "three";
import type { InspectionTarget } from "./targets";

export function createComputerInspection(scene: Scene): InspectionTarget {
  const tower = scene.getObjectByName("white-desktop-tower");
  const monitor = scene.getObjectByName("computer-monitor");
  if (!tower || !monitor) throw new Error("PCとモニターのモデルが見つかりません。");
  tower.updateWorldMatrix(true, true);
  const worldBounds = new Box3().setFromObject(tower).expandByObject(monitor);
  const anchor = new Object3D();
  worldBounds.getCenter(anchor.position).applyMatrix4(tower.matrixWorld.clone().invert());
  anchor.rotation.y = -Math.PI / 6;
  tower.add(anchor);
  anchor.updateWorldMatrix(true, false);
  const bounds = worldBounds.applyMatrix4(anchor.matrixWorld.clone().invert());
  const size = bounds.getSize(new Vector3());
  const object = new Mesh(new BoxGeometry(size.x, size.y, size.z), new MeshBasicMaterial());
  bounds.getCenter(object.position);
  object.name = "computer-inspection";
  object.visible = false;
  anchor.add(object);
  return { object, width: size.x, height: size.y, depth: size.z };
}
