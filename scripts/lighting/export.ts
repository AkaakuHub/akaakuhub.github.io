import { Light, Mesh } from "three";
import type { Scene } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { bakedMeshes, lightingFingerprint } from "../../src/scene/lighting/baked";

export async function exportLightingScene(scene: Scene) {
  const fingerprint = lightingFingerprint(scene);
  const copy = scene.clone(true);
  const removed: (Light | Mesh)[] = [];
  copy.traverse((object) => {
    if (object instanceof Light || (object instanceof Mesh && object.name === "world-sky"))
      removed.push(object);
  });
  for (const object of removed) object.removeFromParent();
  const meshes = bakedMeshes(copy).map((mesh, index) => {
    mesh.name = `lighting-${index.toString().padStart(4, "0")}`;
    const vertices = mesh.geometry.getAttribute("position").count;
    const usedVertices = mesh.geometry.index
      ? [...new Set(mesh.geometry.index.array)].sort((first, second) => first - second)
      : Array.from({ length: vertices }, (_, vertex) => vertex);
    return { name: mesh.name, vertices, usedVertices };
  });
  copy.updateMatrixWorld(true);
  const binary = await new GLTFExporter().parseAsync(copy, { binary: true, onlyVisible: true });
  if (!(binary instanceof ArrayBuffer)) throw new Error("部屋のGLBを書き出せませんでした。");
  return { binary: new Uint8Array(binary), fingerprint, meshes };
}
