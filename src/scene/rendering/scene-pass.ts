import { AlwaysDepth, DepthTexture, HalfFloatType, Matrix4, RenderTarget } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";
import { MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import { positionGeometry, texture, vec4 } from "three/tsl";

export class ScenePass {
  private readonly depth = new DepthTexture(1, 1);
  private readonly target = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: this.depth,
  });
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private dirty = true;
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
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    this.material.fragmentNode = texture(this.target.texture);
    this.material.depthNode = texture(this.depth).r;
  }

  invalidate(): void {
    this.dirty = true;
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
    const direct = moving && composite;
    try {
      if (
        moving ||
        this.dirty ||
        !this.world.equals(this.camera.matrixWorld) ||
        !this.projection.equals(this.camera.projectionMatrix)
      ) {
        renderer.setRenderTarget(direct ? output : this.target);
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
        this.dirty = direct;
      }
      if (composite && !direct) {
        renderer.setRenderTarget(output);
        renderer.render(this.quad, this.quad.camera);
      }
      return composite ? output : this.target;
    } finally {
      renderer.autoClear = autoClear;
    }
  }
}
