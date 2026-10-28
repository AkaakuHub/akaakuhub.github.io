import { HalfFloatType, MathUtils, RenderTarget } from "three";
import type { Texture } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh, RenderPipeline } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import {
  float,
  positionGeometry,
  sRGBTransferEOTF,
  sRGBTransferOETF,
  texture,
  uniform,
  vec4,
} from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { DisplayState } from "./display-state";

export class DisplayPass {
  private readonly target = new RenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
  private readonly exposure = uniform(1);
  private readonly headroom = uniform(1);
  private readonly visibility = uniform(0);
  private readonly material = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly composite = new QuadMesh(this.material);
  private readonly pipeline;
  private readonly source;
  private readonly state = new DisplayState();
  private readonly display = window.matchMedia("(dynamic-range: high)");
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private startedAt: number | undefined;

  constructor(
    private readonly renderer: Renderer,
    source: Texture,
  ) {
    this.source = texture(source);
    const exposed = this.source.rgb.mul(this.exposure).max(0);
    const mapped = this.headroom.mul(float(1).sub(exposed.div(this.headroom).negate().exp()));
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    const encoded = new ConvertNode<"vec3">(sRGBTransferOETF(mapped), "vec3");
    this.material.fragmentNode = vec4(encoded, 1);
    const antialiased = new ConvertNode<"vec4">(fxaa(texture(this.target.texture)), "vec4");
    const linear = new ConvertNode<"vec3">(sRGBTransferEOTF(antialiased.rgb), "vec3");
    const visible = new ConvertNode<"vec3">(sRGBTransferOETF(linear.mul(this.visibility)), "vec3");
    this.pipeline = new RenderPipeline(renderer, vec4(visible, 1));
    this.pipeline.outputColorTransform = false;
  }

  get revealing(): boolean {
    return this.visibility.value < 1;
  }

  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  render(source: Texture, revision: number, changing: boolean): void {
    const renderer = this.renderer;
    const now = performance.now();
    this.startedAt ??= now;
    this.visibility.value = this.reducedMotion.matches
      ? 1
      : MathUtils.smoothstep(now - this.startedAt, 0, 300);
    this.source.value = source;
    this.exposure.value = renderer.toneMappingExposure;
    this.headroom.value = this.display.matches ? 4 : 1;
    if (
      this.state.update(
        {
          source,
          revision,
          exposure: this.exposure.value,
          headroom: this.headroom.value,
        },
        changing,
      )
    ) {
      renderer.setRenderTarget(this.target);
      renderer.render(this.composite, this.composite.camera);
    }
    renderer.setRenderTarget(null);
    const depth = renderer.depth;
    const toneMapping = renderer.toneMapping;
    const colorSpace = renderer.outputColorSpace;
    const xr = renderer.xr.enabled;
    try {
      renderer.depth = false;
      this.pipeline.render();
    } finally {
      renderer.depth = depth;
      renderer.toneMapping = toneMapping;
      renderer.outputColorSpace = colorSpace;
      renderer.xr.enabled = xr;
    }
  }
}
