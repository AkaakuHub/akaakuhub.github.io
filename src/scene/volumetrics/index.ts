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
    lightDepth: new Uniform<Texture | null>(null),
    inverseProjection: new Uniform(new Matrix4()),
    cameraWorld: new Uniform(new Matrix4()),
    lightMatrix: new Uniform(new Matrix4()),
    eye: new Uniform(new Vector3()),
    lightDirection: new Uniform(new Vector3()),
    lightRadiance: new Uniform(new Vector3()),
    lightShadowBias: new Uniform(0),
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
    private readonly light: DirectionalLight,
    steps: number,
  ) {
    super();
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
    const scatteringWidth = Math.max(1, Math.ceil(width / 4));
    const scatteringHeight = Math.max(1, Math.ceil(height / 4));
    this.target.setSize(scatteringWidth, scatteringHeight);
    this.uniforms.scatteringSize.value.set(scatteringWidth, scatteringHeight);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    if (!readBuffer.depthTexture) throw new Error("部屋の深度テクスチャが生成されていません。");
    this.uniforms.sceneDepth.value = readBuffer.depthTexture;
    const depth = this.light.shadow.map?.depthTexture;
    if (!depth) throw new Error("天体光の深度テクスチャが生成されていません。");
    this.uniforms.lightDepth.value = depth;
    this.uniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
    this.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
    this.uniforms.lightMatrix.value.copy(this.light.shadow.matrix);
    this.uniforms.lightShadowBias.value = this.light.shadow.bias;
    this.camera.getWorldPosition(this.uniforms.eye.value);
    this.light.target.getWorldPosition(this.targetPosition);
    this.light
      .getWorldPosition(this.uniforms.lightDirection.value)
      .sub(this.targetPosition)
      .normalize();
    this.uniforms.lightRadiance.value
      .set(this.light.color.r, this.light.color.g, this.light.color.b)
      .multiplyScalar(this.light.intensity);
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
