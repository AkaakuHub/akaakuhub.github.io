import { Box3, Mesh, Vector3 } from "three";
import type { DirectionalLight, Scene } from "three";

export function shadowCasterBounds(scene: Scene): Box3 {
  const bounds = new Box3();
  scene.updateMatrixWorld(true);
  scene.traverseVisible((object) => {
    if (object instanceof Mesh && object.castShadow) bounds.expandByObject(object);
  });
  if (bounds.isEmpty()) throw new Error("影を落とす部材がありません。");
  return bounds;
}

export function fitShadowCamera(light: DirectionalLight, bounds: Box3): void {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  light.shadow.updateMatrices(light);
  const camera = light.shadow.camera;
  const view = bounds.clone().applyMatrix4(camera.matrixWorldInverse);
  const size = view.getSize(new Vector3()).addScalar(0.06);
  const center = view.getCenter(new Vector3());
  const pixelX = size.x / light.shadow.mapSize.x;
  const pixelY = size.y / light.shadow.mapSize.y;
  const x = Math.round(center.x / pixelX) * pixelX;
  const y = Math.round(center.y / pixelY) * pixelY;
  camera.left = x - size.x / 2 - pixelX;
  camera.right = x + size.x / 2 + pixelX;
  camera.bottom = y - size.y / 2 - pixelY;
  camera.top = y + size.y / 2 + pixelY;
  camera.near = Math.max(0.01, -view.max.z - 0.03);
  camera.far = Math.max(camera.near + 0.01, -view.min.z + 0.03);
  const pixel = Math.max(pixelX, pixelY);
  light.shadow.normalBias = Math.min(0.002, pixel * 0.2);
  light.shadow.bias = (-pixel * 0.1) / (camera.far - camera.near);
  camera.updateProjectionMatrix();
  light.shadow.updateMatrices(light);
}
