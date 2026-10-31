import { BackSide, DirectionalLight, FrontSide, Mesh } from "three";
import type { Material, Scene } from "three";
import { NodeMaterial, ShadowNode } from "three/webgpu";
import type { Renderer } from "three/webgpu";

type ShadowCompiler = Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">;

function opaque(material: Material): boolean {
  return (
    !material.transparent &&
    material.opacity === 1 &&
    material.alphaTest === 0 &&
    !material.alphaHash &&
    !("alphaMap" in material && material.alphaMap) &&
    !("transmission" in material && material.transmission) &&
    !("displacementMap" in material && material.displacementMap) &&
    !(
      material instanceof NodeMaterial &&
      (material.positionNode ||
        material.castShadowPositionNode ||
        material.castShadowNode ||
        material.maskShadowNode ||
        material.maskNode ||
        material.depthNode ||
        ("transmissionNode" in material && material.transmissionNode) ||
        material.backdropNode)
    )
  );
}

export async function prepareShadows(renderer: ShadowCompiler, scene: Scene): Promise<void> {
  const lights: DirectionalLight[] = [];
  const casters: Mesh[] = [];
  scene.traverseVisible((object) => {
    if (object instanceof DirectionalLight && object.castShadow && object.shadow.map)
      lights.push(object);
    if (
      object instanceof Mesh &&
      object.castShadow &&
      !Array.isArray(object.material) &&
      opaque(object.material)
    )
      casters.push(object);
  });
  if (lights.length === 0 || casters.length === 0) return;
  const target = renderer.getRenderTarget();
  const override = scene.overrideMaterial;
  scene.updateMatrixWorld(true);
  performance.mark("room-shadow-shaders-start");
  try {
    for (const light of lights) {
      const shadow = light.shadow;
      shadow.updateMatrices(light);
      const material = new ShadowNode(light, shadow).getShadowMaterial();
      const side = material.side;
      try {
        scene.overrideMaterial = material;
        renderer.setRenderTarget(shadow.map);
        for (const mesh of casters) {
          const source = mesh.material;
          if (Array.isArray(source)) throw new Error("影の材質が複数あります。");
          material.side =
            source.shadowSide !== null
              ? source.shadowSide
              : source.side === FrontSide
                ? BackSide
                : source.side === BackSide
                  ? FrontSide
                  : source.side;
          await renderer.compileAsync(mesh, shadow.camera, scene);
        }
      } finally {
        material.side = side;
      }
    }
    performance.mark("room-shadow-shaders-ready");
  } finally {
    scene.overrideMaterial = override;
    renderer.setRenderTarget(target);
  }
}
