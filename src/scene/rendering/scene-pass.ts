import {
  AlwaysDepth,
  DepthTexture,
  HalfFloatType,
  Matrix4,
  ShaderMaterial,
  Uniform,
  WebGLRenderTarget,
} from "three";
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

export class ScenePass extends Pass {
  private readonly target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private dirty = true;
  moving = false;
  revision = 0;
  private readonly quad = new FullScreenQuad(
    new ShaderMaterial({
      uniforms: {
        sceneColor: new Uniform(this.target.texture),
        sceneDepth: new Uniform(this.target.depthTexture),
      },
      vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `uniform sampler2D sceneColor;
        uniform sampler2D sceneDepth;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(sceneColor, vUv);
          gl_FragDepth = texture2D(sceneDepth, vUv).r;
        }`,
      depthFunc: AlwaysDepth,
      toneMapped: false,
    }),
  );

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly dynamicSurfaces: readonly Object3D[],
  ) {
    super();
    this.needsSwap = false;
  }

  invalidate(): void {
    this.dirty = true;
  }

  override setSize(width: number, height: number): void {
    this.target.setSize(width, height);
    this.dirty = true;
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    this.camera.updateMatrixWorld();
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    if (
      this.moving ||
      this.dirty ||
      !this.world.equals(this.camera.matrixWorld) ||
      !this.projection.equals(this.camera.projectionMatrix)
    ) {
      renderer.setRenderTarget(this.moving ? readBuffer : this.target);
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
      this.dirty = this.moving;
      this.revision++;
    }
    if (!this.moving) {
      renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
      this.quad.render(renderer);
    }
    renderer.autoClear = autoClear;
  }

  override dispose(): void {
    this.target.dispose();
    this.quad.material.dispose();
    this.quad.dispose();
  }
}
