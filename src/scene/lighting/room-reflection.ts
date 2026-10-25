import { Color, DirectionalLight, Vector3 } from "three";
import { PMREMGenerator } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import type { Object3D, Scene, RenderTarget } from "three";

export function createRoomReflection(scene: Scene, renderer: Renderer) {
  const generator = new PMREMGenerator(renderer);
  const position = new Vector3(0, 1.45, 0);
  const unlit = new Color(0);
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
    const background = scene.background;
    const visibility = sources.map((object) => ({ object, visible: object.visible }));
    for (const { object } of visibility) object.visible = false;
    scene.environment = null;
    scene.background = unlit;
    scene.traverse((object) => {
      if (object instanceof DirectionalLight) object.shadow.needsUpdate = true;
    });
    let next: RenderTarget;
    try {
      next = generator.fromScene(scene, 0, 0.05, 24, { position, size: 128 });
    } finally {
      scene.environment = environment;
      scene.background = background;
      for (const { object, visible } of visibility) object.visible = visible;
    }
    scene.environment = next.texture;
    scene.environmentIntensity = 1;
    reflection?.dispose();
    reflection = next;
    capturedAt = timestamp;
  };
}
