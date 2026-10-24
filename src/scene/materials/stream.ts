import { Mesh, MeshStandardMaterial } from "three";
import type { Scene, Texture } from "three";

const slots = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "alphaMap"] as const;

export function streamMaterials(
  scene: Scene,
  pending: ReadonlyMap<Texture<ImageBitmap | null>, Promise<void>>,
  invalidate: () => void,
): Promise<void[]> {
  const materials = new Map<MeshStandardMaterial, Mesh[]>();
  scene.traverseVisible((object) => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) return;
    const meshes = materials.get(object.material);
    if (meshes) meshes.push(object);
    else materials.set(object.material, [object]);
  });
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
      if (bindings.length === 0) return;
      for (const mesh of meshes) mesh.visible = false;
      await Promise.all(bindings.map(({ ready }) => ready));
      for (const { slot, map } of bindings) material[slot] = map;
      material.needsUpdate = true;
      for (const mesh of meshes) mesh.visible = true;
      invalidate();
    }),
  );
}
