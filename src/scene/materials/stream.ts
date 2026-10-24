import { Group, Mesh, MeshStandardMaterial } from "three";
import type { Camera, Scene, Texture, WebGLRenderer } from "three";

const slots = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "alphaMap"] as const;

export function streamMaterials(
  scene: Scene,
  pending: ReadonlyMap<Texture<ImageBitmap | null>, Promise<void>>,
  renderer: WebGLRenderer,
  camera: Camera,
  ready: (completed: number, total: number) => void,
): Promise<void[]> {
  const materials = new Map<MeshStandardMaterial, Mesh[]>();
  scene.traverseVisible((object) => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) return;
    const meshes = materials.get(object.material);
    if (meshes) meshes.push(object);
    else materials.set(object.material, [object]);
  });
  let completed = 0;
  return Promise.all(
    [...materials].map(async ([material, meshes]) => {
      const bindings: { slot: (typeof slots)[number]; map: Texture; ready: Promise<void> }[] = [];
      for (const slot of slots) {
        const map = material[slot];
        if (!map || map.image) continue;
        const source = [...pending].find(([texture]) => texture.source === map.source);
        if (!source) throw new Error("材質の読み込み対象が見つかりません。");
        bindings.push({ slot, map, ready: source[1] });
        material[slot] = null;
      }
      for (const mesh of meshes) mesh.visible = false;
      await Promise.all(bindings.map(({ ready }) => ready));
      for (const { slot, map } of bindings) material[slot] = map;
      if (bindings.length > 0) material.needsUpdate = true;
      const group = new Group();
      for (const mesh of meshes) {
        const candidate = mesh.clone(false);
        candidate.visible = true;
        group.add(candidate);
      }
      await renderer.compileAsync(group, camera, scene);
      for (const mesh of meshes) mesh.visible = true;
      completed++;
      ready(completed, materials.size);
    }),
  );
}
