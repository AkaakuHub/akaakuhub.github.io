import {
  Color,
  CubeUVReflectionMapping,
  DirectionalLight,
  HalfFloatType,
  LinearFilter,
  PerspectiveCamera,
  RenderTarget,
  Scene,
  Vector3,
  WebGPUCoordinateSystem,
} from "three";
import { PMREMGenerator } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import type { Object3D } from "three";
import { pmremTexture, vec3 } from "three/tsl";
import { prepareRoomShaders } from "../rendering/prepare";

export function createRoomReflection(scene: Scene, renderer: Renderer) {
  const generator = new PMREMGenerator(renderer);
  const position = new Vector3(0, 1.45, 0);
  const captureScene = new Scene();
  captureScene.background = new Color(0);
  captureScene.environmentNode = vec3(0);
  captureScene.environmentIntensity = 0;
  const direct = new RenderTarget(384, 512, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  direct.texture.mapping = CubeUVReflectionMapping;
  const environmentNode = pmremTexture(direct.texture);
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

  function update(date: Date, force = false): void {
    const timestamp = date.getTime();
    if (!force && capturedAt !== undefined && Math.abs(timestamp - capturedAt) < 300_000) return;
    const visibility = sources.map((object) => ({ object, visible: object.visible }));
    for (const { object } of visibility) object.visible = false;
    captureScene.children = scene.children;
    scene.traverse((object) => {
      if (object instanceof DirectionalLight) object.shadow.needsUpdate = true;
    });
    let next: RenderTarget;
    try {
      next = generator.fromScene(captureScene, 0, 0.05, 24, {
        position,
        size: 128,
        renderTarget: reflection,
      });
    } finally {
      for (const { object, visible } of visibility) object.visible = visible;
    }
    scene.environment = next.texture;
    environmentNode.value = next.texture;
    scene.environmentIntensity = 1;
    reflection = next;
    capturedAt = timestamp;
  }
  return {
    update,
    async prepare(onProgress: (event: ProgressEvent) => void): Promise<void> {
      captureScene.children = scene.children;
      const camera = new PerspectiveCamera(90, 1, 0.05, 24);
      camera.coordinateSystem = WebGPUCoordinateSystem;
      camera.position.copy(position);
      await prepareRoomShaders(renderer, captureScene, camera, onProgress, false);
    },
  };
}
