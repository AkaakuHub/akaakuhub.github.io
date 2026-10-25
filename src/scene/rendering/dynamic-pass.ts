import type { Mesh, Object3D, PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

export class DynamicSurfacePass {
  constructor(
    monitor: Mesh,
    fanSurfaces: readonly Mesh[],
    private readonly contributions: Object3D,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
  ) {
    for (const source of [monitor, ...fanSurfaces]) source.layers.enable(1);
    scene.traverse((object) => {
      if ("isLight" in object) object.layers.enable(1);
    });
  }

  render(renderer: Renderer, target: RenderTarget): void {
    this.contributions.traverse((object) => object.layers.enable(1));
    const layers = this.camera.layers.mask;
    const background = this.scene.background;
    const autoClear = renderer.autoClear;
    this.camera.layers.set(1);
    this.scene.background = null;
    renderer.autoClear = false;
    renderer.setRenderTarget(target);
    try {
      renderer.render(this.scene, this.camera);
    } finally {
      renderer.autoClear = autoClear;
      this.scene.background = background;
      this.camera.layers.mask = layers;
    }
  }
}
