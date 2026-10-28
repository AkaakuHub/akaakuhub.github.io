import type { MeshPhysicalMaterialParameters } from "three";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { Fn, materialMetalness, mix, reference, texture, vec3 } from "three/tsl";
import type { PbrMaps } from "./library";
import { surfaceParameters } from "./surface";

const paintColor = Fn((builder) => {
  const { material } = builder;
  if ("isShadowPassMaterial" in material && material.isShadowPassMaterial === true) return vec3(1);
  if (!(material instanceof MeshPhysicalNodeMaterial))
    throw new Error("塗装金属の材質を確認できませんでした。");
  const tint = reference("color", "color", material);
  if (!material.map) return tint;
  return texture(material.map).rgb.mul(mix(tint, vec3(1), materialMetalness));
});

export function paintedSurface(
  maps: PbrMaps,
  parameters: MeshPhysicalMaterialParameters,
): MeshPhysicalNodeMaterial {
  const material = new MeshPhysicalNodeMaterial({
    ...surfaceParameters(maps),
    metalness: 1,
    metalnessMap: maps.roughnessMap,
    ...parameters,
  });
  material.colorNode = paintColor();
  return material;
}
