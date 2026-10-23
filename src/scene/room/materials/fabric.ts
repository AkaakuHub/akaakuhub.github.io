import {
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  RepeatWrapping,
  RGBADepthPacking,
  RGBAFormat,
} from "three";
import { grain, texturedSurface } from "./texture";

export function curtainMaterials() {
  const cloth = texturedSurface(
    128,
    (u, v) => {
      const warp = Math.sin(u * Math.PI * 128) * 0.8;
      const weft = Math.sin(v * Math.PI * 128) * 0.5;
      const fiber = grain(Math.floor(u * 128), Math.floor(v * 128));
      return [
        205 + warp + fiber,
        196 + weft + fiber,
        169 + fiber,
        0.5 + (warp + weft) * 0.025,
        0.95,
      ];
    },
    [3, 8],
  );
  const material = new MeshPhysicalMaterial({
    map: cloth.map,
    normalMap: cloth.normalMap,
    normalScale: cloth.normalScale,
    roughnessMap: cloth.roughnessMap,
    roughness: 1,
    side: DoubleSide,
    transparent: true,
    opacity: 0.9,
    transmission: 0.12,
    thickness: 0.002,
    ior: 1.45,
    depthWrite: false,
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
  alphaMap.repeat.set(28, 84);
  alphaMap.magFilter = LinearFilter;
  alphaMap.needsUpdate = true;
  const depth = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    alphaMap,
    alphaTest: 0.5,
    side: DoubleSide,
  });
  cloth.dispose();
  return { material, depth };
}
