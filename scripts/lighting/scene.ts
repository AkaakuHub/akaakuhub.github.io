import {
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Ray,
  Vector2,
} from "three";
import type { Scene, Texture, Vector3 } from "three";
import { MeshBVH, SAH, StaticGeometryGenerator } from "three-mesh-bvh";
import { bakedMeshes } from "../../src/scene/lighting/baked";

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
    if (image instanceof ImageBitmap && texture.flipY) point.y = 1 - point.y;
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(point.x * canvas.width)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(point.y * canvas.height)));
    const index = (y * canvas.width + x) * 4;
    return new Color().setRGB(
      pixels[index]! / 255,
      pixels[index + 1]! / 255,
      pixels[index + 2]! / 255,
    );
  };
}

export function createBakeScene(scene: Scene) {
  scene.updateMatrixWorld(true);
  const meshes = bakedMeshes(scene);
  const emitters = new Set<MeshStandardMaterial>();
  scene.traverseVisible((object) => {
    if (
      object instanceof Mesh &&
      object.name === "room-fluorescent" &&
      object.material instanceof MeshStandardMaterial
    ) {
      meshes.push(object);
      emitters.add(object.material);
    }
  });
  const opaque = meshes.filter(
    (mesh) =>
      !(mesh.material instanceof MeshStandardMaterial && mesh.material.transparent) &&
      !(mesh.material instanceof MeshPhysicalMaterial && mesh.material.transmission > 0),
  );
  const translucent = new Set(
    opaque.filter((mesh) => mesh.customDepthMaterial).map((mesh) => mesh.material),
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
  const materialIds = new Uint32Array(geometry.getAttribute("position").count);
  const index = geometry.index;
  if (!index) throw new Error("ベイク対象の頂点番号がありません。");
  for (const group of geometry.groups) {
    if (group.materialIndex === undefined) throw new Error("ベイク対象の材質番号がありません。");
    for (let offset = group.start; offset < group.start + group.count; offset++)
      materialIds[index.getX(offset)] = group.materialIndex;
  }
  geometry.clearGroups();
  const bvh = new MeshBVH(geometry, { strategy: SAH });
  const ray = new Ray();
  const textures = new Map<Texture, ReturnType<typeof texturePixels>>();
  function sample(texture: Texture, uv: Vector2): Color {
    let pixels = textures.get(texture);
    if (!pixels) {
      texture.updateMatrix();
      pixels = texturePixels(texture);
      textures.set(texture, pixels);
    }
    return pixels(uv);
  }
  function trace(origin: Vector3, direction: Vector3, far = 24) {
    ray.set(origin, direction);
    let near = 0.0002;
    while (near < far) {
      const hit = bvh.raycastFirst(ray, DoubleSide, near, far);
      if (!hit?.face || !hit.uv || !hit.normal) return null;
      const materialId = materialIds[hit.face.a];
      const material = materialId === undefined ? undefined : materials[materialId];
      if (!(material instanceof MeshStandardMaterial)) throw new Error("反射先の材質が不正です。");
      if (material.alphaMap && sample(material.alphaMap, hit.uv).g < material.alphaTest) {
        near = hit.distance + 0.0002;
        continue;
      }
      return {
        point: hit.point,
        distance: hit.distance,
        normal: hit.normal.normalize(),
        uv: hit.uv,
        material,
        transmission: translucent.has(material) ? 0.25 : 0,
        emitter: emitters.has(material),
      };
    }
    return null;
  }
  function visibility(
    origin: Vector3,
    direction: Vector3,
    distance: number,
    lightSource = false,
  ): number {
    let transmission = 1;
    let travelled = 0;
    const point = origin.clone();
    while (travelled < distance) {
      const hit = trace(point, direction, distance - travelled);
      if (!hit) return transmission;
      if (!hit.emitter || !lightSource) {
        if (hit.transmission === 0) return 0;
        transmission *= hit.transmission;
      }
      const step = hit.distance + 0.001;
      travelled += step;
      point.addScaledVector(direction, step);
    }
    return transmission;
  }
  function albedo(material: MeshStandardMaterial, uv: Vector2): Color {
    const color = material.color.clone();
    if (material.map) color.multiply(sample(material.map, uv).convertSRGBToLinear());
    return color.multiplyScalar(1 - material.metalness);
  }
  return { trace, visibility, albedo, dispose: () => geometry.dispose() };
}

export type BakeScene = ReturnType<typeof createBakeScene>;
