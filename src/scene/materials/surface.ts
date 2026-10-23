import { MeshStandardMaterial, Vector2 } from "three";
import type { MeshStandardMaterialParameters } from "three";
import type { PbrMaps } from "./library";

export function scannedSurface(
  maps: PbrMaps,
  parameters: MeshStandardMaterialParameters = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new Vector2(0.45, 0.45),
    aoMap: maps.aoMap,
    roughnessMap: maps.roughnessMap,
    metalnessMap: maps.metalnessMap,
    roughness: 1,
    metalness: 0,
    ...parameters,
  });
}
