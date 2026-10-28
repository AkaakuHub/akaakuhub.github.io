import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { float, materialIOR, normalView, positionViewDirection } from "three/tsl";

export function thinGlassMaterial(): MeshPhysicalNodeMaterial {
  const material = new MeshPhysicalNodeMaterial({
    color: "#ffffff",
    metalness: 1,
    roughness: 0.065,
    ior: 1.52,
    transparent: true,
    depthWrite: false,
  });
  const cosine = normalView.dot(positionViewDirection).abs().clamp(0, 1);
  const f0 = materialIOR.sub(1).div(materialIOR.add(1)).pow(2);
  const reflection = f0.add(float(1).sub(f0).mul(float(1).sub(cosine).pow(5)));
  material.opacityNode = reflection.mul(2).div(reflection.add(1));
  return material;
}
