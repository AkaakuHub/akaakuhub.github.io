import { DepthTexture, HalfFloatType, Matrix4, NearestFilter, RenderTarget, Vector3 } from "three";
import type { DirectionalLight, PerspectiveCamera, Texture } from "three";
import { FunctionNode, MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import { texture, uniform, uv, wgslFn } from "three/tsl";
import roomSource from "./room.wgsl?raw";
import surfaceSource from "./surface.wgsl?raw";
import scatteringSource from "./scattering.wgsl?raw";
import compositeSource from "./composite.wgsl?raw";
import { ScatteringState } from "./state";

const roomInterval = new FunctionNode(roomSource, [], "wgsl");
const surfaceAt = new FunctionNode(surfaceSource, [], "wgsl");
const integrate = wgslFn(scatteringSource, [roomInterval, surfaceAt]);
const composite = wgslFn(compositeSource, [roomInterval, surfaceAt]);

export class VolumetricPass {
  private readonly target = new RenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  });
  private readonly shadowDepth = texture(new DepthTexture(1, 1));
  private readonly inverseProjection = uniform(new Matrix4());
  private readonly cameraWorld = uniform(new Matrix4());
  private readonly lightMatrix = uniform(new Matrix4());
  private readonly eye = uniform(new Vector3());
  private readonly direction = uniform(new Vector3());
  private readonly radiance = uniform(new Vector3());
  private readonly bias = uniform(0);
  private readonly extinction = uniform(0.003);
  private readonly targetPosition = new Vector3();
  private readonly scatteringMaterial = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly compositeMaterial = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly quad = new QuadMesh(this.scatteringMaterial);
  private readonly state = new ScatteringState();

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly light: DirectionalLight,
    depth: DepthTexture,
    color: Texture,
    steps: number,
  ) {
    const sceneDepth = texture(depth);
    this.scatteringMaterial.fragmentNode = integrate({
      sceneDepth,
      lightDepth: this.shadowDepth,
      uv: uv(),
      inverseProjection: this.inverseProjection,
      cameraWorld: this.cameraWorld,
      lightMatrix: this.lightMatrix,
      eye: this.eye,
      lightDirection: this.direction,
      lightRadiance: this.radiance,
      bias: this.bias,
      steps: uniform(steps, "int"),
      extinction: this.extinction,
    });
    this.compositeMaterial.fragmentNode = composite({
      sceneColor: texture(color),
      scattering: texture(this.target.texture),
      sceneDepth,
      uv: uv(),
      inverseProjection: this.inverseProjection,
      cameraWorld: this.cameraWorld,
      eye: this.eye,
      extinction: this.extinction,
    });
  }
  setSize(width: number, height: number): void {
    this.target.setSize(Math.max(1, Math.ceil(width / 4)), Math.max(1, Math.ceil(height / 4)));
    this.state.invalidate();
  }
  invalidate(): void {
    this.state.invalidate();
  }
  render(renderer: Renderer, output: RenderTarget): void {
    const depth = this.light.shadow.map?.depthTexture;
    if (!depth) throw new Error("天体光の深度テクスチャが生成されていません。");
    this.shadowDepth.value = depth;
    this.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
    this.cameraWorld.value.copy(this.camera.matrixWorld);
    this.lightMatrix.value.copy(this.light.shadow.matrix);
    this.bias.value = this.light.shadow.bias;
    this.camera.getWorldPosition(this.eye.value);
    this.light.target.getWorldPosition(this.targetPosition);
    this.light.getWorldPosition(this.direction.value).sub(this.targetPosition).normalize();
    this.radiance.value
      .set(this.light.color.r, this.light.color.g, this.light.color.b)
      .multiplyScalar(this.light.intensity);
    if (this.state.update(this.camera, this.light)) {
      this.quad.material = this.scatteringMaterial;
      renderer.setRenderTarget(this.target);
      this.quad.render(renderer);
    }
    this.quad.material = this.compositeMaterial;
    renderer.setRenderTarget(output);
    this.quad.render(renderer);
  }
}
