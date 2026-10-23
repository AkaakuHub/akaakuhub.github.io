import {
  DoubleSide,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoBlending,
  ShaderMaterial,
  Uniform,
} from "three";
import type { Material, Texture } from "three";
import vertexShader from "./normals.vert.glsl?raw";
import fragmentShader from "./normals.frag.glsl?raw";

export function createNormalMaterial(): ShaderMaterial {
  const uniforms = {
    alphaMask: new Uniform<Texture | null>(null),
    maskTransform: new Uniform(new Matrix3()),
    alphaThreshold: new Uniform(0),
    clearGlass: new Uniform(false),
  };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: DoubleSide,
    blending: NoBlending,
    toneMapped: false,
  });
  material.onBeforeRender = (...parameters: Parameters<ShaderMaterial["onBeforeRender"]>) => {
    const object = parameters[4];
    if (!(object instanceof Mesh)) throw new Error("接触影の対象は3Dの面に限定されています。");
    const source: Material | Material[] = object.material;
    if (Array.isArray(source)) throw new Error("接触影の材質は部材ごとに指定してください。");
    uniforms.clearGlass.value = source instanceof MeshPhysicalMaterial && source.transmission === 1;
    uniforms.alphaThreshold.value = 0;
    uniforms.alphaMask.value = null;
    if (
      (source instanceof MeshStandardMaterial || source instanceof MeshBasicMaterial) &&
      source.alphaMap
    ) {
      if (source.alphaMap.matrixAutoUpdate) source.alphaMap.updateMatrix();
      uniforms.alphaMask.value = source.alphaMap;
      uniforms.maskTransform.value.copy(source.alphaMap.matrix);
      uniforms.alphaThreshold.value = source.alphaTest;
    }
    material.uniformsNeedUpdate = true;
  };
  return material;
}
