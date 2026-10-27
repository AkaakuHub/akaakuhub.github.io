import { Frustum, Matrix4, Mesh } from "three";
import type { Object3D, PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

export class DynamicSurfacePass {
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly surfaces: readonly Object3D[];

  constructor(
    monitor: Mesh,
    fanSurfaces: readonly Mesh[],
    private readonly contributions: Object3D,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
  ) {
    this.surfaces = [monitor, ...fanSurfaces, contributions];
    for (const source of [monitor, ...fanSurfaces]) source.layers.enable(1);
    scene.traverse((object) => {
      if ("isLight" in object) object.layers.enable(1);
    });
  }

  private hasVisibleSurface(): boolean {
    this.camera.updateMatrixWorld();
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection, this.camera.coordinateSystem);
    for (const surface of this.surfaces) {
      let parent: Object3D | null = surface;
      while (parent?.visible) parent = parent.parent;
      if (parent) continue;
      let visible = false;
      surface.traverseVisible((object) => {
        if (
          object instanceof Mesh &&
          (!object.frustumCulled || this.frustum.intersectsObject(object))
        )
          visible = true;
      });
      if (visible) return true;
    }
    return false;
  }

  render(
    renderer: Pick<Renderer, "autoClear" | "setRenderTarget" | "render">,
    target: RenderTarget,
  ): void {
    if (!this.hasVisibleSurface()) return;
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
