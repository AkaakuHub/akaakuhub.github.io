import {
  Color,
  DepthTexture,
  HalfFloatType,
  NearestFilter,
  UnsignedIntType,
  WebGLRenderTarget,
} from "three";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";
import { createNormalMaterial } from "./material";

export class SurfaceDepthPass extends Pass {
  readonly depthTexture = new DepthTexture(1, 1, UnsignedIntType);
  private readonly target = new WebGLRenderTarget(1, 1, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    type: HalfFloatType,
    depthTexture: this.depthTexture,
  });
  private readonly material = createNormalMaterial();
  private readonly clearColor = new Color();
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;

  constructor(scene: Scene, camera: PerspectiveCamera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.needsSwap = false;
  }

  get normalTexture() {
    return this.target.texture;
  }

  override setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  override render(renderer: WebGLRenderer): void {
    const target = renderer.getRenderTarget();
    const override = this.scene.overrideMaterial;
    const background = this.scene.background;
    const autoClear = renderer.autoClear;
    const clearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clearColor);
    try {
      renderer.autoClear = false;
      renderer.setRenderTarget(this.target);
      renderer.setClearColor(0x7777ff, 1);
      renderer.clear();
      this.scene.overrideMaterial = this.material;
      this.scene.background = null;
      renderer.render(this.scene, this.camera);
    } finally {
      this.scene.overrideMaterial = override;
      this.scene.background = background;
      renderer.autoClear = autoClear;
      renderer.setClearColor(this.clearColor, clearAlpha);
      renderer.setRenderTarget(target);
    }
  }

  override dispose(): void {
    this.target.dispose();
    this.material.dispose();
  }
}
