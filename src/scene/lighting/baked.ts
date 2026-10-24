import { Float16BufferAttribute, Mesh, MeshStandardMaterial, Uniform, Vector3 } from "three";
import type { Scene } from "three";
import type { RoomAssetLoader } from "../../assets/loading";

export function bakedMeshes(scene: Scene): Mesh[] {
  const meshes: Mesh[] = [];
  scene.traverseVisible((object) => {
    if (
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial &&
      object.name !== "room-fluorescent"
    )
      meshes.push(object);
  });
  return meshes;
}

export function lightingFingerprint(scene: Scene): string {
  scene.updateMatrixWorld(true);
  let first = 2166136261;
  let second = 5381;
  function update(bytes: Uint8Array): void {
    for (const value of bytes) {
      first = Math.imul(first ^ value, 16777619);
      second = Math.imul(second, 33) ^ value;
    }
  }
  for (const mesh of bakedMeshes(scene)) {
    const material = mesh.material;
    if (!(material instanceof MeshStandardMaterial))
      throw new Error("ベイク対象の材質が不正です。");
    for (const name of ["position", "normal"]) {
      const array = mesh.geometry.getAttribute(name).array;
      update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    }
    const transform = new Float64Array([...mesh.matrixWorld.elements, ...material.color.toArray()]);
    update(new Uint8Array(transform.buffer));
    update(new TextEncoder().encode(material.map?.name));
  }
  return [first, second].map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
}

export async function prepareBakedLighting(assets: RoomAssetLoader): Promise<ArrayBuffer> {
  return assets.load("lighting/fluorescent.data", async (bytes) =>
    new Response(
      new Blob([Uint8Array.from(bytes)]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer(),
  );
}

export function createBakedLighting(scene: Scene) {
  const expectedFingerprint = lightingFingerprint(scene);
  const meshes = bakedMeshes(scene);
  const skyRadiance = new Uniform(new Vector3());
  function apply(buffer: ArrayBuffer): void {
    const fingerprint = new TextDecoder().decode(new Uint8Array(buffer, 0, 16));
    if (fingerprint !== expectedFingerprint)
      throw new Error("部屋の形状と照明のベイクデータが一致しません。");
    const values = new Uint16Array(buffer, 16);
    const materials = new Set<MeshStandardMaterial>();
    let offset = 0;
    for (const mesh of meshes) {
      const length = mesh.geometry.getAttribute("position").count * 3;
      mesh.geometry.setAttribute(
        "bakedFluorescent",
        new Float16BufferAttribute(values.subarray(offset, offset + length), 3),
      );
      mesh.geometry.setAttribute(
        "bakedSky",
        new Float16BufferAttribute(values.subarray(offset + length, offset + length * 2), 3),
      );
      offset += length * 2;
      if (mesh.material instanceof MeshStandardMaterial) materials.add(mesh.material);
    }
    if (offset !== values.length) throw new Error("照明のベイクデータの長さが不正です。");
    for (const material of materials) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.bakedSkyRadiance = skyRadiance;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nattribute vec3 bakedFluorescent;\nattribute vec3 bakedSky;\nvarying vec3 vBakedFluorescent;\nvarying vec3 vBakedSky;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvBakedFluorescent = bakedFluorescent;\nvBakedSky = bakedSky;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform vec3 bakedSkyRadiance;\nvarying vec3 vBakedFluorescent;\nvarying vec3 vBakedSky;",
          )
          .replace(
            "#include <lights_fragment_maps>",
            "#include <lights_fragment_maps>\n#if defined(RE_IndirectDiffuse)\niblIrradiance = vec3(0.0);\nirradiance += vBakedFluorescent + vBakedSky * bakedSkyRadiance;\n#endif",
          );
      };
      material.customProgramCacheKey = () => "baked-room-irradiance";
      material.needsUpdate = true;
    }
  }
  return { skyRadiance, apply };
}
