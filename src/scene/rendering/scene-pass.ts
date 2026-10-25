import {
  AlwaysDepth,
  DepthTexture,
  HalfFloatType,
  Matrix4,
  MathUtils,
  ShaderMaterial,
  Uniform,
  WebGLRenderTarget,
} from "three";
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

export class ScenePass extends Pass {
  private target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  private previous = this.target.clone();
  private readonly motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private transitionPending = false;
  private transitionStarted = -Infinity;
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private dirty = true;
  revision = 0;
  private readonly uniforms = {
    sceneColor: new Uniform(this.target.texture),
    sceneDepth: new Uniform(this.target.depthTexture),
    previousColor: new Uniform(this.previous.texture),
    transition: new Uniform(1),
  };
  private readonly material = new ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D sceneColor;
        uniform sampler2D sceneDepth;
        uniform sampler2D previousColor;
        uniform float transition;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(sceneColor, vUv);
          if (transition < 1.0) color = mix(texture2D(previousColor, vUv), color, transition);
          gl_FragColor = color;
          gl_FragDepth = texture2D(sceneDepth, vUv).r;
        }`,
    depthFunc: AlwaysDepth,
    toneMapped: false,
  });
  private readonly quad = new FullScreenQuad(this.material);

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

  beginTransition(): void {
    this.transitionPending = this.revision > 0 && !this.motion.matches;
  }

  get transitioning(): boolean {
    return performance.now() - this.transitionStarted < 140;
  }

  override setSize(width: number, height: number): void {
    this.target.setSize(width, height);
    this.previous.setSize(width, height);
    this.transitionPending = false;
    this.transitionStarted = -Infinity;
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
      this.dirty ||
      !this.world.equals(this.camera.matrixWorld) ||
      !this.projection.equals(this.camera.projectionMatrix)
    ) {
      if (this.transitionPending) {
        const previous = this.previous;
        this.previous = this.target;
        this.target = previous;
        this.transitionStarted = performance.now();
        this.transitionPending = false;
      }
      renderer.setRenderTarget(this.target);
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
      this.dirty = false;
      this.revision++;
    }
    const uniforms = this.uniforms;
    uniforms.sceneColor.value = this.target.texture;
    uniforms.sceneDepth.value = this.target.depthTexture;
    uniforms.previousColor.value = this.transitioning ? this.previous.texture : this.target.texture;
    uniforms.transition.value = MathUtils.smoothstep(
      (performance.now() - this.transitionStarted) / 140,
      0,
      1,
    );
    renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
    this.quad.render(renderer);
    renderer.autoClear = autoClear;
  }

  override dispose(): void {
    this.target.dispose();
    this.previous.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
