import { Box3, Frustum, Matrix4, Scene, Vector3 } from "three";
import type { Object3D, PerspectiveCamera, RenderTarget } from "three";
import type { Renderer } from "three/webgpu";
import { preparePass } from "./prepare-pass";

const windowBounds = new Box3(new Vector3(-2.8, 0.98, -1.94), new Vector3(-2.5, 2.55, 1.94));

export class SkyPass {
  private readonly scene = new Scene();
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly previousWorld = new Matrix4();
  private readonly previousProjection = new Matrix4();
  private coordinateSystem: PerspectiveCamera["coordinateSystem"] | undefined;
  private visibility = false;

  constructor(
    object: Object3D,
    private readonly camera: PerspectiveCamera,
  ) {
    this.scene.add(object);
  }

  get visible(): boolean {
    this.camera.updateMatrixWorld();
    if (
      this.coordinateSystem === this.camera.coordinateSystem &&
      this.previousWorld.equals(this.camera.matrixWorld) &&
      this.previousProjection.equals(this.camera.projectionMatrix)
    )
      return this.visibility;
    this.coordinateSystem = this.camera.coordinateSystem;
    this.previousWorld.copy(this.camera.matrixWorld);
    this.previousProjection.copy(this.camera.projectionMatrix);
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.visibility = this.frustum
      .setFromProjectionMatrix(this.projection, this.camera.coordinateSystem)
      .intersectsBox(windowBounds);
    return this.visibility;
  }

  async prepare(
    renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
    target: RenderTarget,
  ): Promise<void> {
    await preparePass(renderer, this.scene, this.camera, target);
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
