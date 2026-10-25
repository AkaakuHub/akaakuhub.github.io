import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import type { Scene } from "three";
import type { InspectionTarget } from "./targets";

export function createComputerInspection(
  scene: Scene,
): InspectionTarget & { resizeInspection: () => void } {
  const tower = scene.getObjectByName("white-desktop-tower");
  const monitor = scene.getObjectByName("computer-display-head");
  if (!tower || !monitor) throw new Error("PCとモニターのモデルが見つかりません。");
  tower.updateWorldMatrix(true, true);
  const towerBounds = new Box3().setFromObject(tower);
  const anchor = new Object3D();
  anchor.rotation.y = -Math.PI / 6;
  tower.add(anchor);
  const object = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  object.name = "computer-inspection";
  object.visible = false;
  anchor.add(object);
  const resizeInspection = (): void => {
    const worldBounds = towerBounds.clone().expandByObject(monitor);
    worldBounds.getCenter(anchor.position).applyMatrix4(tower.matrixWorld.clone().invert());
    anchor.updateMatrix();
    anchor.updateWorldMatrix(true, false);
    const bounds = worldBounds.applyMatrix4(anchor.matrixWorld.clone().invert());
    const size = bounds.getSize(new Vector3());
    object.geometry.dispose();
    object.geometry = new BoxGeometry(size.x, size.y, size.z);
    bounds.getCenter(object.position);
    object.updateMatrix();
  };
  resizeInspection();
  return {
    object,
    get width() {
      return object.geometry.parameters.width;
    },
    get height() {
      return object.geometry.parameters.height;
    },
    get depth() {
      return object.geometry.parameters.depth;
    },
    resizeInspection,
    topAligned: false,
  };
}
