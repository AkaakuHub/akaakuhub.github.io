import { DoubleSide, MeshPhysicalMaterial } from "three";
import type { PbrMaps } from "../../materials/library";

export function curtainMaterials(maps: PbrMaps) {
  return new MeshPhysicalMaterial({
    map: maps.map,
    normalMap: maps.normalMap,
    roughnessMap: maps.roughnessMap,
    aoMap: maps.aoMap,
    roughness: 1,
    color: "#e8e3d5",
    sheen: 0.45,
    sheenRoughness: 0.95,
    sheenColor: "#eee9dd",
    side: DoubleSide,
  });
}
