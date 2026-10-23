import {
  HalfFloatType,
  Matrix4,
  NearestFilter,
  ShaderMaterial,
  Uniform,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import type { DirectionalLight, PerspectiveCamera, Texture, WebGLRenderer } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";
import vertexShader from "./fullscreen.vert.glsl?raw";
import integration from "./integration.glsl?raw";
import scatteringShader from "./scattering.frag.glsl?raw";
import compositeShader from "./composite.frag.glsl?raw";

export class VolumetricPass extends Pass {
  private readonly target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  });
  private readonly uniforms = {
    sceneDepth: new Uniform<Texture | null>(null),
    sunDepth: new Uniform<Texture | null>(null),
    inverseProjection: new Uniform(new Matrix4()),
    cameraWorld: new Uniform(new Matrix4()),
    sunMatrix: new Uniform(new Matrix4()),
    eye: new Uniform(new Vector3()),
    sunDirection: new Uniform(new Vector3()),
    sunRadiance: new Uniform(new Vector3()),
    sceneColor: new Uniform<Texture | null>(null),
    scattering: new Uniform(this.target.texture),
    scatteringSize: new Uniform(new Vector2(1, 1)),
  };
  private readonly scatteringMaterial: ShaderMaterial;
  private readonly compositeMaterial: ShaderMaterial;
  private readonly quad = new FullScreenQuad();
  private readonly targetPosition = new Vector3();

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly sun: DirectionalLight,
    depth: Texture,
    steps: number,
  ) {
    super();
    this.uniforms.sceneDepth.value = depth;
    const options = {
      uniforms: this.uniforms,
      vertexShader,
      defines: { SCATTER_STEPS: steps },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    };
    this.scatteringMaterial = new ShaderMaterial({
      ...options,
      name: "RoomScattering",
      fragmentShader: integration + scatteringShader,
    });
    this.compositeMaterial = new ShaderMaterial({
      ...options,
      name: "RoomScatteringComposite",
      fragmentShader: integration + compositeShader,
    });
  }

  override setSize(width: number, height: number): void {
    const halfWidth = Math.max(1, Math.ceil(width / 2));
    const halfHeight = Math.max(1, Math.ceil(height / 2));
    this.target.setSize(halfWidth, halfHeight);
    this.uniforms.scatteringSize.value.set(halfWidth, halfHeight);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    const depth = this.sun.shadow.map?.depthTexture;
    if (!depth) throw new Error("太陽光の深度テクスチャが生成されていません。");
    this.uniforms.sunDepth.value = depth;
    this.uniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
    this.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
    this.uniforms.sunMatrix.value.copy(this.sun.shadow.matrix);
    this.camera.getWorldPosition(this.uniforms.eye.value);
    this.sun.target.getWorldPosition(this.targetPosition);
    this.sun
      .getWorldPosition(this.uniforms.sunDirection.value)
      .sub(this.targetPosition)
      .normalize();
    this.uniforms.sunRadiance.value
      .set(this.sun.color.r, this.sun.color.g, this.sun.color.b)
      .multiplyScalar(this.sun.intensity);
    this.quad.material = this.scatteringMaterial;
    renderer.setRenderTarget(this.target);
    this.quad.render(renderer);
    this.uniforms.sceneColor.value = readBuffer.texture;
    this.quad.material = this.compositeMaterial;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  override dispose(): void {
    this.target.dispose();
    this.scatteringMaterial.dispose();
    this.compositeMaterial.dispose();
    this.quad.dispose();
  }
}
