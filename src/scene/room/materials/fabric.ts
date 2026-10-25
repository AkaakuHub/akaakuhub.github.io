import { DoubleSide, MeshPhysicalMaterial, Vector2 } from "three";
import type { PbrMaps } from "../../materials/library";

export function curtainMaterials(maps: PbrMaps) {
  return new MeshPhysicalMaterial({
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new Vector2(0.24, 0.24),
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
