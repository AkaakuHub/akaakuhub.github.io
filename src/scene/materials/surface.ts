import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { MeshPhysicalMaterialParameters, MeshStandardMaterialParameters } from "three";
import type { PbrMaps } from "./library";

function pbrParameters(maps: PbrMaps): MeshStandardMaterialParameters {
  return {
    map: maps.map,
    normalMap: maps.normalMap,
    aoMap: maps.aoMap,
    roughnessMap: maps.roughnessMap,
    alphaMap: maps.alphaMap,
    roughness: 1,
    metalness: 0,
  };
}

export function scannedSurface(
  maps: PbrMaps,
  parameters: MeshStandardMaterialParameters = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial({ ...pbrParameters(maps), ...parameters });
}

export function physicalSurface(
  maps: PbrMaps,
  parameters: MeshPhysicalMaterialParameters,
): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({ ...pbrParameters(maps), ...parameters });
}
