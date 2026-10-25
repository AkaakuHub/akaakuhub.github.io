import { Frustum, Matrix4, Mesh, Texture } from "three";
import type { PerspectiveCamera, Scene } from "three";

export function visibleTextures(scene: Scene, camera: PerspectiveCamera): Set<Texture> {
  scene.updateMatrixWorld();
  camera.updateMatrixWorld();
  const projection = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const frustum = new Frustum().setFromProjectionMatrix(projection, camera.coordinateSystem);
  const textures = new Set<Texture>();
  scene.traverseVisible((object) => {
    if (!(object instanceof Mesh)) return;
    const visible =
      object.layers.test(camera.layers) &&
      (!object.frustumCulled || frustum.intersectsObject(object));
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      const entries: [string, unknown][] = Object.entries(material);
      for (const [name, value] of entries) {
        if (!(value instanceof Texture)) continue;
        if (
          visible ||
          (object.castShadow && material.alphaTest > 0 && (name === "map" || name === "alphaMap"))
        )
          textures.add(value);
      }
    }
  });
  return textures;
}
