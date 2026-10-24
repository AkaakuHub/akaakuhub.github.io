import { Color, DataUtils, Matrix3, MeshStandardMaterial, Vector3 } from "three";
import type { Scene } from "three";
import { bakedMeshes, lightingFingerprint } from "../../src/scene/lighting/baked";
import { fluorescentColor } from "../../src/scene/lighting/fixtures";
import { createBakeScene } from "./scene";
import { createLightSampler } from "./sources";
import { sampleDiffuse } from "./diffuse";

export async function bakeLighting(
  scene: Scene,
  progress: (completed: number, total: number) => void,
): Promise<Uint8Array> {
  const meshes = bakedMeshes(scene);
  const geometry = createBakeScene(scene);
  const lights = createLightSampler(geometry);
  const total = meshes.reduce(
    (count, mesh) => count + mesh.geometry.getAttribute("position").count,
    0,
  );
  const data = new Uint16Array(total * 6);
  const cached = new Map<string, readonly number[]>();
  const vertex = new Vector3();
  const normal = new Vector3();
  const normalMatrix = new Matrix3();
  let completed = 0;
  let offset = 0;
  for (const mesh of meshes) {
    const sampleCount =
      mesh.material instanceof MeshStandardMaterial && mesh.material.name === "room-ceiling"
        ? 4096
        : 256;
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute("position");
    const normals = mesh.geometry.getAttribute("normal");
    for (let index = 0; index < positions.count; index++) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
      normal.fromBufferAttribute(normals, index).applyNormalMatrix(normalMatrix);
      const key = [
        ...vertex.toArray().map((value) => Math.round(value * 1000)),
        ...normal.toArray().map((value) => Math.round(value * 100)),
      ].join(",");
      let baked = cached.get(key);
      if (!baked) {
        const direct = lights.direct(vertex, normal);
        const fluorescent = fluorescentColor.clone().multiplyScalar(direct.fluorescent);
        const sky = new Color().setRGB(direct.sky, direct.sky, direct.sky);
        for (let sample = 0; sample < sampleCount; sample++) {
          let point = vertex.clone();
          let facing = normal.clone();
          const throughput = new Color(1, 1, 1);
          for (let bounce = 0; bounce < 4; bounce++) {
            const origin = point.clone().addScaledVector(facing, 0.001);
            const { direction, weight } = sampleDiffuse(
              origin,
              facing,
              sample,
              sampleCount,
              bounce,
            );
            if (weight === 0) break;
            const hit = geometry.trace(origin, direction);
            if (!hit || hit.emitter) break;
            throughput
              .multiply(geometry.albedo(hit.material, hit.uv))
              .multiplyScalar(weight * (1 - hit.transmission));
            if (Math.max(throughput.r, throughput.g, throughput.b) < 0.002) break;
            const incoming = lights.indirect(hit.point, hit.normal);
            fluorescent.add(
              throughput
                .clone()
                .multiply(fluorescentColor)
                .multiplyScalar(incoming.fluorescent / sampleCount),
            );
            sky.add(throughput.clone().multiplyScalar(incoming.sky / sampleCount));
            point = hit.point;
            facing = hit.normal;
          }
        }
        baked = [...fluorescent.toArray(), ...sky.toArray()];
        if (baked.some((value) => !Number.isFinite(value) || value < 0))
          throw new Error("照明ベイクに不正な値が含まれています。");
        cached.set(key, baked);
      }
      for (let channel = 0; channel < 3; channel++) {
        data[offset + index * 3 + channel] = DataUtils.toHalfFloat(baked[channel]!);
        data[offset + positions.count * 3 + index * 3 + channel] = DataUtils.toHalfFloat(
          baked[channel + 3]!,
        );
      }
    }
    completed += positions.count;
    offset += positions.count * 6;
    progress(completed, total);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  geometry.dispose();
  const output = new Uint8Array(16 + data.byteLength);
  output.set(new TextEncoder().encode(lightingFingerprint(scene)));
  output.set(new Uint8Array(data.buffer), 16);
  return output;
}
