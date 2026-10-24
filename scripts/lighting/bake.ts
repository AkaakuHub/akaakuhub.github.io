import {
  Color,
  DataUtils,
  DoubleSide,
  Matrix3,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Ray,
  Vector2,
  Vector3,
} from "three";
import type { Scene, Texture } from "three";
import { MeshBVH, SAH, StaticGeometryGenerator } from "three-mesh-bvh";
import { bakedMeshes, lightingFingerprint } from "../../src/scene/lighting/baked";
import {
  fixtureHeight,
  fixturePositions,
  fluorescentColor,
  fluorescentRadiance,
} from "../../src/scene/lighting/fixtures";
import { photometry } from "../../src/scene/lighting/photometry";

function texturePixels(texture: Texture) {
  const image: unknown = texture.image;
  if (!(image instanceof ImageBitmap) && !(image instanceof HTMLCanvasElement))
    throw new Error("ベイク対象の画像を読み込めません。");
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("ベイク対象の画像を描画できません。");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  return (uv: Vector2): Color => {
    const point = texture.transformUv(uv.clone());
    const x = Math.min(canvas.width - 1, Math.floor(point.x * canvas.width));
    const y = Math.min(canvas.height - 1, Math.floor(point.y * canvas.height));
    const index = (y * canvas.width + x) * 4;
    return new Color().setRGB(
      pixels[index]! / 255,
      pixels[index + 1]! / 255,
      pixels[index + 2]! / 255,
    );
  };
}

export async function bakeLighting(
  scene: Scene,
  progress: (completed: number, total: number) => void,
): Promise<Uint8Array> {
  const meshes = bakedMeshes(scene);
  const opaque = meshes.filter(
    (mesh) =>
      !(mesh.material instanceof MeshStandardMaterial && mesh.material.transparent) &&
      !(mesh.material instanceof MeshPhysicalMaterial && mesh.material.transmission > 0),
  );
  const occluders = opaque.map((mesh) => {
    const clone = mesh.clone(false);
    clone.geometry = mesh.geometry.clone();
    if (!clone.geometry.index)
      clone.geometry.setIndex(
        Array.from({ length: clone.geometry.getAttribute("position").count }, (_, index) => index),
      );
    return clone;
  });
  const generator = new StaticGeometryGenerator(occluders);
  generator.attributes = ["position", "normal", "uv"];
  const geometry = generator.generate();
  for (const mesh of occluders) mesh.geometry.dispose();
  const materials = generator.getMaterials();
  const bvh = new MeshBVH(geometry, { strategy: SAH });
  const textures = new Map<Texture, ReturnType<typeof texturePixels>>();
  const ray = new Ray();
  function sample(texture: Texture, uv: Vector2): Color {
    let pixels = textures.get(texture);
    if (!pixels) {
      texture.updateMatrix();
      pixels = texturePixels(texture);
      textures.set(texture, pixels);
    }
    return pixels(uv);
  }
  function trace(origin: Vector3, direction: Vector3, far = 20) {
    ray.set(origin, direction);
    let near = 0.0002;
    while (near < far) {
      const hit = bvh.raycastFirst(ray, DoubleSide, near, far);
      if (!hit?.face || !hit.uv) return null;
      const material = materials[hit.face.materialIndex];
      if (!(material instanceof MeshStandardMaterial))
        throw new Error("ベイク対象の材質が不正です。");
      if (material.alphaMap && sample(material.alphaMap, hit.uv).g < material.alphaTest) {
        near = hit.distance + 0.0002;
        continue;
      }
      return { hit, material };
    }
    return null;
  }
  const sources: Vector3[] = [];
  for (const z of fixturePositions)
    for (const x of [-0.085, 0.085])
      for (let index = 0; index < 4; index++)
        sources.push(
          new Vector3(x, fixtureHeight, z + ((index + 0.5) / 4 - 0.5) * photometry.fixtureLength),
        );
  const area = (photometry.fixtureWidth * photometry.fixtureLength) / 8;
  const directCache = new Map<string, number>();
  function direct(point: Vector3, normal: Vector3): number {
    let irradiance = 0;
    const origin = point.clone().addScaledVector(normal, 0.001);
    for (const source of sources) {
      const direction = source.clone().sub(origin);
      const distance = direction.length();
      direction.divideScalar(distance);
      const cosine = Math.max(0, normal.dot(direction)) * Math.max(0, direction.y);
      if (cosine === 0 || trace(origin, direction, distance - 0.003)) continue;
      irradiance += (fluorescentRadiance * area * cosine) / (distance * distance);
    }
    return irradiance;
  }
  function bounceDirect(point: Vector3, normal: Vector3): number {
    const key = [
      ...point.toArray().map((value) => Math.round(value / 0.08)),
      ...normal.toArray().map((value) => Math.round(value * 16)),
    ].join(",");
    let value = directCache.get(key);
    if (value === undefined) {
      value = direct(point, normal);
      directCache.set(key, value);
    }
    return value;
  }
  const values: number[] = [];
  const cached = new Map<string, readonly number[]>();
  const vertex = new Vector3();
  const normal = new Vector3();
  const normalMatrix = new Matrix3();
  const total = meshes.reduce(
    (count, mesh) => count + mesh.geometry.getAttribute("position").count,
    0,
  );
  let completed = 0;
  for (const mesh of meshes) {
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
        const result = fluorescentColor.clone().multiplyScalar(direct(vertex, normal));
        const tangent = new Vector3(0, 1, 0);
        if (Math.abs(normal.y) > 0.9) tangent.set(1, 0, 0);
        tangent.cross(normal).normalize();
        const bitangent = new Vector3().crossVectors(normal, tangent);
        const origin = vertex.clone().addScaledVector(normal, 0.001);
        let occlusion = 0;
        const count = 32;
        for (let sampleIndex = 0; sampleIndex < count; sampleIndex++) {
          const radius = Math.sqrt((sampleIndex + 0.5) / count);
          const angle = sampleIndex * 2.399963229728653;
          const direction = tangent
            .clone()
            .multiplyScalar(radius * Math.cos(angle))
            .addScaledVector(bitangent, radius * Math.sin(angle))
            .addScaledVector(normal, Math.sqrt(1 - radius * radius));
          const surface = trace(origin, direction);
          if (!surface) {
            occlusion += 1;
            continue;
          }
          occlusion += Math.min(1, surface.hit.distance / 0.3);
          const face = surface.hit.face;
          if (!face || !surface.hit.uv) throw new Error("ベイク対象の面が不正です。");
          const bounceNormal = face.normal.clone();
          if (bounceNormal.dot(direction) > 0) bounceNormal.negate();
          const albedo = surface.material.color.clone();
          if (surface.material.map)
            albedo.multiply(sample(surface.material.map, surface.hit.uv).convertSRGBToLinear());
          result.add(
            albedo
              .multiply(fluorescentColor)
              .multiplyScalar(
                ((1 - surface.material.metalness) * bounceDirect(surface.hit.point, bounceNormal)) /
                  count,
              ),
          );
        }
        baked = [...result.toArray(), occlusion / count];
        if (baked.some((value) => !Number.isFinite(value) || value < 0))
          throw new Error("照明ベイクに不正な値が含まれています。");
        cached.set(key, baked);
      }
      values.push(...baked);
    }
    completed += positions.count;
    progress(completed, total);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const data = Uint16Array.from(values, DataUtils.toHalfFloat);
  const output = new Uint8Array(16 + data.byteLength);
  output.set(new TextEncoder().encode(lightingFingerprint(scene)));
  output.set(new Uint8Array(data.buffer), 16);
  geometry.dispose();
  return output;
}
