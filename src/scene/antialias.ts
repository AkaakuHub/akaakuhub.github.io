import { ShaderMaterial, Uniform, Vector2 } from "three";
import type { Texture, WebGLRenderer, WebGLRenderTarget } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

export class AntialiasPass extends Pass {
  private readonly uniforms = {
    tDiffuse: new Uniform<Texture | null>(null),
    resolution: new Uniform(new Vector2()),
  };
  private readonly material = new ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: FXAAShader.vertexShader,
    fragmentShader: FXAAShader.fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly quad = new FullScreenQuad(this.material);

  override setSize(width: number, height: number): void {
    this.uniforms.resolution.value.set(1 / width, 1 / height);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    this.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  override dispose(): void {
    this.material.dispose();
    this.quad.dispose();
  }
}
