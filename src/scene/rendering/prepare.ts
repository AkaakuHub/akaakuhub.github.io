import { Group, HalfFloatType, Mesh, RenderTarget } from "three";
import type { BufferGeometry, Material, Object3D, PerspectiveCamera, Scene } from "three";
import type { Renderer } from "three/webgpu";

function isMesh(object: Object3D): object is Mesh<BufferGeometry, Material | Material[]> {
  return object instanceof Mesh;
}

export async function prepareRoomShaders(
  renderer: Renderer,
  scene: Scene,
  camera: PerspectiveCamera,
  onProgress: (event: ProgressEvent) => void,
): Promise<void> {
  scene.updateMatrixWorld(true);
  const group = new Group();
  const variants = new Set<string>();
  scene.traverseVisible((object) => {
    if (!isMesh(object)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const key = [
      materials.map((material) => material.uuid).join(","),
      object.receiveShadow,
      object.layers.mask,
      ...Object.entries(object.geometry.attributes).map(([name, attribute]) =>
        [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name].join(
          ":",
        ),
      ),
    ].join(";");
    if (variants.has(key)) return;
    variants.add(key);
    const sample = object.clone(false);
    sample.matrix.copy(object.matrixWorld);
    sample.matrixAutoUpdate = false;
    sample.frustumCulled = false;
    group.add(sample);
  });
  const target = new RenderTarget(64, 64, { type: HalfFloatType });
  const previous = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    await renderer.compileAsync(group, camera, scene, onProgress);
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
    group.clear();
  }
}
