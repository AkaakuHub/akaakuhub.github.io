import { Frustum, Group, HalfFloatType, Matrix4, Mesh, RenderTarget } from "three";
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
  visibleOnly = true,
): Promise<void> {
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  const frustum = new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    camera.coordinateSystem,
  );
  const group = new Group();
  const samples: Mesh[] = [];
  const variants = new Set<string>();
  scene.traverseVisible((object) => {
    if (!isMesh(object)) return;
    if (visibleOnly && object.frustumCulled && !frustum.intersectsObject(object)) return;
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
    samples.push(sample);
  });
  const target = new RenderTarget(64, 64, { type: HalfFloatType });
  try {
    for (let index = 0; index < samples.length; index += 4) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      group.clear();
      group.add(...samples.slice(index, index + 4));
      const previous = renderer.getRenderTarget();
      let compilation: Promise<void>;
      try {
        renderer.setRenderTarget(target);
        compilation = renderer.compileAsync(group, camera, scene);
      } finally {
        renderer.setRenderTarget(previous);
      }
      await compilation;
      onProgress(
        new ProgressEvent("progress", {
          lengthComputable: true,
          loaded: Math.min(index + 4, samples.length),
          total: samples.length,
        }),
      );
    }
  } finally {
    target.dispose();
    group.clear();
  }
}
