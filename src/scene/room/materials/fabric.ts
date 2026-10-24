import {
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  RepeatWrapping,
  RGBADepthPacking,
  RGBAFormat,
  Vector2,
} from "three";
import type { PbrMaps } from "../../materials/library";

export function curtainMaterials(maps: PbrMaps) {
  const material = new MeshPhysicalMaterial({
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new Vector2(0.3, 0.3),
    roughnessMap: maps.roughnessMap,
    aoMap: maps.aoMap,
    roughness: 1,
    color: "#eee5c9",
    sheen: 0.85,
    sheenRoughness: 0.85,
    sheenColor: "#ebe2c5",
    side: DoubleSide,
  });
  const holes = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const clear = (x + y * 3) % 5 === 0;
      const value = clear ? 0 : 255;
      holes.set([value, value, value, 255], (y * 32 + x) * 4);
    }
  }
  const alphaMap = new DataTexture(holes, 32, 32, RGBAFormat);
  alphaMap.wrapS = RepeatWrapping;
  alphaMap.wrapT = RepeatWrapping;
  alphaMap.repeat.set(42, 42);
  alphaMap.magFilter = LinearFilter;
  alphaMap.needsUpdate = true;
  const depth = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    alphaMap,
    alphaTest: 0.5,
    side: DoubleSide,
  });
  return { material, depth };
}
