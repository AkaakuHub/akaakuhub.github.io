import { Frustum, Matrix4, Mesh } from "three";
import type { Object3D, PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

type SurfaceRenderer = Pick<Renderer, "autoClear" | "setRenderTarget" | "render">;

export class DynamicSurfacePass {
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly activeSurfaces: Object3D[] = [];
  private readonly cachedSurfaces: Object3D[];
  private readonly allSurfaces: readonly Object3D[];
  private computerActive = false;
  private contributionsActive = false;

  constructor(
    private readonly monitor: Mesh,
    private readonly fanSurfaces: readonly Mesh[],
    private readonly contributions: Object3D,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly staticSurfaces: Object3D,
  ) {
    this.allSurfaces = [monitor, ...fanSurfaces, contributions];
    this.cachedSurfaces = [...this.allSurfaces];
    for (const surface of [monitor, ...fanSurfaces]) surface.layers.enable(1);
    scene.traverse((object) => {
      if ("isLight" in object) object.layers.enable(1);
    });
  }

  setActive(computer: boolean, contributions: boolean): boolean {
    if (computer === this.computerActive && contributions === this.contributionsActive)
      return false;
    this.computerActive = computer;
    this.contributionsActive = contributions;
    this.activeSurfaces.length = 0;
    this.cachedSurfaces.length = 0;
    for (const surface of [this.monitor, ...this.fanSurfaces]) {
      (computer ? this.activeSurfaces : this.cachedSurfaces).push(surface);
    }
    (contributions ? this.activeSurfaces : this.cachedSurfaces).push(this.contributions);
    return true;
  }

  private hasVisibleSurface(surfaces: readonly Object3D[]): boolean {
    if (surfaces.length === 0) return false;
    this.camera.updateMatrixWorld();
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection, this.camera.coordinateSystem);
    for (const surface of surfaces) {
      let parent: Object3D | null = surface;
      while (parent?.visible) parent = parent.parent;
      if (parent) continue;
      surface.updateWorldMatrix(true, true);
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

  get visible(): boolean {
    return this.hasVisibleSurface(this.activeSurfaces);
  }

  render(renderer: SurfaceRenderer, target: RenderTarget): void {
    this.renderSurfaces(renderer, target, this.activeSurfaces);
  }

  renderStatic(renderer: SurfaceRenderer, target: RenderTarget): void {
    this.renderSurfaces(renderer, target, this.cachedSurfaces);
  }

  private renderSurfaces(
    renderer: SurfaceRenderer,
    target: RenderTarget,
    surfaces: readonly Object3D[],
  ): void {
    if (!this.hasVisibleSurface(surfaces)) return;
    if (surfaces.includes(this.contributions))
      this.contributions.traverse((object) => object.layers.enable(1));
    const hidden = this.allSurfaces
      .filter((surface) => !surfaces.includes(surface))
      .map((object) => ({ object, visible: object.visible }));
    for (const { object } of hidden) object.visible = false;
    const layers = this.camera.layers.mask;
    const background = this.scene.background;
    const autoClear = renderer.autoClear;
    const staticVisible = this.staticSurfaces.visible;
    this.staticSurfaces.visible = false;
    this.camera.layers.set(1);
    this.scene.background = null;
    renderer.autoClear = false;
    renderer.setRenderTarget(target);
    try {
      renderer.render(this.scene, this.camera);
    } finally {
      for (const { object, visible } of hidden) object.visible = visible;
      this.staticSurfaces.visible = staticVisible;
      renderer.autoClear = autoClear;
      this.scene.background = background;
      this.camera.layers.mask = layers;
    }
  }
}
