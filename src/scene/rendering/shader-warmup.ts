import { Mesh } from "three";
import type { PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

type Compiler = Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">;

export class ShaderWarmup {
  private readonly remaining: Mesh[] = [];
  private compiling = false;

  constructor(
    private readonly renderer: Compiler,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly target: RenderTarget,
  ) {
    scene.traverseVisible((object) => {
      if (object instanceof Mesh) this.remaining.push(object);
    });
  }

  get busy(): boolean {
    return this.compiling;
  }

  get pending(): boolean {
    return this.remaining.length > 0;
  }

  start(canPrepare: () => boolean, prepared: () => void, failed: (error: unknown) => void): void {
    const schedule = (): void => {
      if (!this.pending) return;
      setTimeout(() => {
        if (!canPrepare()) {
          schedule();
          return;
        }
        void this.prepareNext().then(() => {
          prepared();
          schedule();
        }, failed);
      }, 100);
    };
    schedule();
  }

  async prepareNext(): Promise<void> {
    if (this.compiling) return;
    const object = this.remaining.pop();
    if (!object) return;
    this.compiling = true;
    const previous = this.renderer.getRenderTarget();
    const culled = object.frustumCulled;
    try {
      object.frustumCulled = false;
      this.renderer.setRenderTarget(this.target);
      await this.renderer.compileAsync(object, this.camera, this.scene);
    } finally {
      object.frustumCulled = culled;
      this.renderer.setRenderTarget(previous);
      this.compiling = false;
    }
  }
}
