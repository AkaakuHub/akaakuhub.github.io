import { Color, PMREMGenerator, Vector3 } from "three";
import type { Object3D, Scene, WebGLRenderer, WebGLRenderTarget } from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

export function createRoomReflection(scene: Scene, renderer: WebGLRenderer) {
  const generator = new PMREMGenerator(renderer);
  const position = new Vector3(0, 1.45, 0);
  const unlit = new Color(0);
  const sources: Object3D[] = [];
  scene.traverse((object) => {
    if (
      object instanceof Reflector ||
      object.name === "world-sky" ||
      object.name === "room-fluorescent"
    )
      sources.push(object);
  });
  let reflection: WebGLRenderTarget | undefined;
  let capturedAt: number | undefined;

  return (date: Date): void => {
    const timestamp = date.getTime();
    if (capturedAt !== undefined && Math.abs(timestamp - capturedAt) < 60_000) return;
    const environment = scene.environment;
    const background = scene.background;
    const visibility = sources.map((object) => object.visible);
    for (const object of sources) object.visible = false;
    scene.environment = null;
    scene.background = unlit;
    renderer.shadowMap.needsUpdate = true;
    let next: WebGLRenderTarget;
    try {
      next = generator.fromScene(scene, 0, 0.05, 24, { position, size: 128 });
    } finally {
      scene.environment = environment;
      scene.background = background;
      for (const [index, object] of sources.entries()) object.visible = visibility[index] === true;
    }
    scene.environment = next.texture;
    scene.environmentIntensity = 1;
    reflection?.dispose();
    reflection = next;
    capturedAt = timestamp;
  };
}
