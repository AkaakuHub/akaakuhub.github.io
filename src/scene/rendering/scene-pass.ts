import { AlwaysDepth, DepthTexture, HalfFloatType, Matrix4, RenderTarget } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";
import { MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import { texture } from "three/tsl";

export class ScenePass {
  private readonly depth = new DepthTexture(1, 1);
  private readonly target = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: this.depth,
  });
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private dirty = true;
  revision = 0;
  private readonly material = new MeshBasicNodeMaterial({
    depthFunc: AlwaysDepth,
    toneMapped: false,
  });
  private readonly quad = new QuadMesh(this.material);

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly dynamicSurfaces: readonly Object3D[],
  ) {
    this.material.fragmentNode = texture(this.target.texture);
    this.material.depthNode = texture(this.depth).r;
  }

  invalidate(): void {
    this.dirty = true;
  }
  compile(renderer: Renderer): ReturnType<Renderer["compileAsync"]> {
    const previous = renderer.getRenderTarget();
    const layers = this.camera.layers.mask;
    try {
      renderer.setRenderTarget(this.target);
      this.camera.layers.enable(1);
      return renderer.compileAsync(this.scene, this.camera);
    } finally {
      this.camera.layers.mask = layers;
      renderer.setRenderTarget(previous);
    }
  }
  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
    this.dirty = true;
  }

  render(renderer: Renderer, output: RenderTarget, moving: boolean): void {
    this.camera.updateMatrixWorld();
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    if (
      moving ||
      this.dirty ||
      !this.world.equals(this.camera.matrixWorld) ||
      !this.projection.equals(this.camera.projectionMatrix)
    ) {
      renderer.setRenderTarget(moving ? output : this.target);
      const visibility = this.dynamicSurfaces.map((object) => ({
        object,
        visible: object.visible,
      }));
      for (const { object } of visibility) object.visible = false;
      try {
        renderer.render(this.scene, this.camera);
      } finally {
        for (const { object, visible } of visibility) object.visible = visible;
      }
      this.world.copy(this.camera.matrixWorld);
      this.projection.copy(this.camera.projectionMatrix);
      this.dirty = moving;
      this.revision++;
    }
    if (!moving) {
      renderer.setRenderTarget(output);
      this.quad.render(renderer);
    }
    renderer.autoClear = autoClear;
  }
}
