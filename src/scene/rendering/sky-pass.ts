import { Box3, Frustum, Matrix4, Scene, Vector3 } from "three";
import type { Object3D, PerspectiveCamera, RenderTarget } from "three";
import type { Renderer } from "three/webgpu";

const windowBounds = new Box3(new Vector3(-2.8, 0.98, -1.94), new Vector3(-2.5, 2.55, 1.94));

export class SkyPass {
  private readonly scene = new Scene();
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();

  constructor(
    object: Object3D,
    private readonly camera: PerspectiveCamera,
  ) {
    this.scene.add(object);
  }

  get visible(): boolean {
    this.camera.updateMatrixWorld();
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    return this.frustum
      .setFromProjectionMatrix(this.projection, this.camera.coordinateSystem)
      .intersectsBox(windowBounds);
  }

  render(
    renderer: Pick<Renderer, "autoClear" | "setRenderTarget" | "render">,
    target: RenderTarget,
  ): void {
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(target);
    try {
      renderer.render(this.scene, this.camera);
    } finally {
      renderer.autoClear = autoClear;
    }
  }
}
