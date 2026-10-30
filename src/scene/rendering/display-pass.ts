import { HalfFloatType, MathUtils, RenderTarget } from "three";
import type { Texture } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh, RenderPipeline } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import {
  float,
  neutralToneMapping,
  positionGeometry,
  sRGBTransferEOTF,
  sRGBTransferOETF,
  texture,
  uniform,
  vec4,
} from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { DisplayState } from "./display-state";

export type HdrObserver = (enabled: boolean, supported: boolean) => void;

export class DisplayPass {
  private readonly staticTarget = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  private readonly motionTarget = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  private target = this.staticTarget;
  private readonly antialiasSource = texture(this.staticTarget.texture);
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
  private refreshOutput = false;
  private hdrEnabled = true;
  private hdrObserver: (() => void) | undefined;

  constructor(
    private readonly renderer: Renderer,
    source: Texture,
  ) {
    this.source = texture(source);
    const exposed = this.source.rgb.mul(this.exposure).max(0);
    const hdr = this.headroom.mul(float(1).sub(exposed.div(this.headroom).negate().exp()));
    const sdr = new ConvertNode<"vec3">(neutralToneMapping(this.source.rgb, this.exposure), "vec3");
    const mapped = this.headroom.greaterThan(1).select(hdr, sdr);
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    const encoded = new ConvertNode<"vec3">(sRGBTransferOETF(mapped), "vec3");
    this.material.fragmentNode = vec4(encoded, 1);
    const antialiased = new ConvertNode<"vec4">(fxaa(this.antialiasSource), "vec4");
    const linear = new ConvertNode<"vec3">(sRGBTransferEOTF(antialiased.rgb), "vec3");
    const visible = new ConvertNode<"vec3">(sRGBTransferOETF(linear.mul(this.visibility)), "vec3");
    this.pipeline = new RenderPipeline(renderer, vec4(visible, 1));
    this.pipeline.outputColorTransform = false;
  }

  get revealing(): boolean {
    return this.visibility.value < 1;
  }

  private get hdrSupported(): boolean {
    const context = this.renderer.getContext();
    return (
      this.display.matches &&
      context instanceof GPUCanvasContext &&
      context.getConfiguration()?.toneMapping !== undefined
    );
  }

  observeHdr(observer: HdrObserver): void {
    this.hdrObserver = () => observer(this.hdrEnabled, this.hdrSupported);
    this.display.addEventListener("change", this.hdrObserver);
    this.hdrObserver();
  }

  toggleHdr(): boolean {
    this.hdrEnabled = !this.hdrEnabled;
    this.state.invalidate();
    this.hdrObserver?.();
    return this.hdrEnabled;
  }

  invalidate(): void {
    this.state.invalidate();
    this.refreshOutput = true;
  }

  setSize(width: number, height: number, moving = false): void {
    this.target = moving ? this.motionTarget : this.staticTarget;
    this.target.setSize(width, height);
    this.antialiasSource.value = this.target.texture;
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
    this.headroom.value = this.hdrEnabled && this.display.matches ? 4 : 1;
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
    if (this.refreshOutput) {
      const context = renderer.getContext();
      if (!(context instanceof GPUCanvasContext))
        throw new Error("WebGPUの表示先が見つかりません。");
      const configuration = context.getConfiguration();
      if (!configuration) throw new Error("WebGPUの表示設定が見つかりません。");
      context.configure(configuration);
      this.refreshOutput = false;
    }
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
