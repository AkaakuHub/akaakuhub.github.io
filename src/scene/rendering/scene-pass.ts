import { AlwaysDepth, DepthTexture, HalfFloatType, Matrix4, RenderTarget } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";
import { MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import { positionGeometry, texture, vec4 } from "three/tsl";
import { preparePass, prepareRenderTargets } from "./prepare-pass";
import type { RoomRenderer } from "./room-renderer";

export class ScenePass {
  private readonly depth = new DepthTexture(1, 1);
  private readonly target = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: this.depth,
  });
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private dirty = true;
  private version = 0;
  private readonly material = new MeshBasicNodeMaterial({
    depthFunc: AlwaysDepth,
    toneMapped: false,
  });
  private readonly quad = new QuadMesh(this.material);

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly dynamicSurfaces: readonly Object3D[],
    private readonly renderStaticSurfaces: (
      renderer: Pick<Renderer, "autoClear" | "setRenderTarget" | "render">,
      target: RenderTarget,
    ) => void,
  ) {
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    this.material.fragmentNode = texture(this.target.texture);
    this.material.depthNode = texture(this.depth).r;
  }

  invalidate(): void {
    this.dirty = true;
  }
  async prepareTarget(
    renderer: Pick<RoomRenderer, "initRenderTarget" | "completedFrame">,
  ): Promise<void> {
    await prepareRenderTargets(renderer, [this.target]);
  }
  async prepare(
    renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
    target: RenderTarget,
  ): Promise<void> {
    await preparePass(renderer, this.quad, this.quad.camera, target);
  }
  get revision(): number {
    return this.version;
  }
  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
    this.dirty = true;
  }

  render(
    renderer: Pick<Renderer, "autoClear" | "setRenderTarget" | "render">,
    output: RenderTarget,
    moving: boolean,
    composite: boolean,
  ): RenderTarget {
    this.camera.updateMatrixWorld();
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    const direct = moving;
    try {
      if (
        moving ||
        this.dirty ||
        !this.world.equals(this.camera.matrixWorld) ||
        !this.projection.equals(this.camera.projectionMatrix)
      ) {
        renderer.setRenderTarget(direct ? output : this.target);
        const visibility = (moving ? [] : this.dynamicSurfaces).map((object) => ({
          object,
          visible: object.visible,
        }));
        for (const { object } of visibility) object.visible = false;
        try {
          renderer.render(this.scene, this.camera);
          this.version++;
        } finally {
          for (const { object, visible } of visibility) object.visible = visible;
        }
        if (!moving) this.renderStaticSurfaces(renderer, this.target);
        this.world.copy(this.camera.matrixWorld);
        this.projection.copy(this.camera.projectionMatrix);
        this.dirty = moving;
      }
      if (composite && !direct) {
        renderer.setRenderTarget(output);
        renderer.render(this.quad, this.quad.camera);
      }
      return direct || composite ? output : this.target;
    } finally {
      renderer.autoClear = autoClear;
    }
  }
}
