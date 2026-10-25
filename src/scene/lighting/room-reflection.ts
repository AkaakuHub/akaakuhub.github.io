import {
  Color,
  CubeUVReflectionMapping,
  DirectionalLight,
  HalfFloatType,
  LinearFilter,
  RenderTarget,
  Vector3,
} from "three";
import { PMREMGenerator } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import type { Object3D, Scene } from "three";
import { pmremTexture, vec3 } from "three/tsl";

export function createRoomReflection(scene: Scene, renderer: Renderer) {
  const generator = new PMREMGenerator(renderer);
  const position = new Vector3(0, 1.45, 0);
  const unlit = new Color(0);
  const direct = new RenderTarget(384, 512, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  direct.texture.mapping = CubeUVReflectionMapping;
  const environmentNode = pmremTexture(direct.texture);
  const captureEnvironment = vec3(0);
  scene.environmentNode = environmentNode;
  const target = renderer.getRenderTarget();
  const clearColor = renderer.getClearColor(new Color());
  const clearAlpha = renderer.getClearAlpha();
  try {
    renderer.setRenderTarget(direct);
    renderer.setClearColor(0, 1);
    renderer.clear();
  } finally {
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.setRenderTarget(target);
  }
  const sources: Object3D[] = [];
  scene.traverse((object) => {
    if (object.name === "world-sky") sources.push(object);
  });
  let reflection: RenderTarget | undefined;
  let capturedAt: number | undefined;

  return (date: Date, force = false): void => {
    const timestamp = date.getTime();
    if (!force && capturedAt !== undefined && Math.abs(timestamp - capturedAt) < 300_000) return;
    const environment = scene.environment;
    const previousEnvironment = scene.environmentNode;
    const intensity = scene.environmentIntensity;
    const background = scene.background;
    const visibility = sources.map((object) => ({ object, visible: object.visible }));
    for (const { object } of visibility) object.visible = false;
    scene.environment = null;
    scene.environmentNode = captureEnvironment;
    scene.environmentIntensity = 0;
    scene.background = unlit;
    scene.traverse((object) => {
      if (object instanceof DirectionalLight) object.shadow.needsUpdate = true;
    });
    let next: RenderTarget;
    try {
      next = generator.fromScene(scene, 0, 0.05, 24, {
        position,
        size: 128,
        renderTarget: reflection,
      });
    } finally {
      scene.environment = environment;
      scene.environmentIntensity = intensity;
      scene.environmentNode = previousEnvironment;
      scene.background = background;
      for (const { object, visible } of visibility) object.visible = visible;
    }
    scene.environment = next.texture;
    environmentNode.value = next.texture;
    scene.environmentIntensity = 1;
    reflection = next;
    capturedAt = timestamp;
  };
}
