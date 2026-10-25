import { Frustum, Group, HalfFloatType, Matrix4, Mesh, RenderTarget } from "three";
import type { BufferGeometry, Material, Object3D, PerspectiveCamera, Scene } from "three";
import type { Renderer } from "three/webgpu";

const preparedScenes = new WeakMap<Scene, Set<string>>();

function isMesh(object: Object3D): object is Mesh<BufferGeometry, Material | Material[]> {
  return object instanceof Mesh;
}

export async function prepareRoomShaders(
  renderer: Renderer,
  scene: Scene,
  camera: PerspectiveCamera,
  onProgress: (event: ProgressEvent) => void,
  visibleOnly = true,
): Promise<void> {
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  const frustum = new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    camera.coordinateSystem,
  );
  const group = new Group();
  const variants = new Set<string>();
  const prepared = preparedScenes.get(scene) ?? new Set<string>();
  scene.traverseVisible((object) => {
    if (!isMesh(object)) return;
    if (visibleOnly && object.frustumCulled && !frustum.intersectsObject(object)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const key = [
      materials.map((material) => `${material.uuid}:${material.version}`).join(","),
      object.receiveShadow,
      object.layers.mask,
      ...Object.entries(object.geometry.attributes).map(([name, attribute]) =>
        [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name].join(
          ":",
        ),
      ),
    ].join(";");
    if (prepared.has(key) || variants.has(key)) return;
    variants.add(key);
    const sample = object.clone(false);
    sample.matrix.copy(object.matrixWorld);
    sample.matrixAutoUpdate = false;
    sample.frustumCulled = false;
    group.add(sample);
  });
  if (group.children.length === 0) return;
  const target = new RenderTarget(64, 64, { type: HalfFloatType });
  try {
    const previous = renderer.getRenderTarget();
    let compilation: Promise<void>;
    try {
      renderer.setRenderTarget(target);
      compilation = renderer.compileAsync(group, camera, scene, onProgress);
    } finally {
      renderer.setRenderTarget(previous);
    }
    await compilation;
    for (const key of variants) prepared.add(key);
    preparedScenes.set(scene, prepared);
  } finally {
    target.dispose();
    group.clear();
  }
}
