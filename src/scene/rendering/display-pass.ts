import { HalfFloatType, MathUtils, RenderTarget } from "three";
import type { Texture } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Node, Renderer } from "three/webgpu";
import {
  Fn,
  If,
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
  private readonly scattering = uniform(false);
  private readonly visibility = uniform(0);
  private readonly material = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly output = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly composite = new QuadMesh(this.material);
  private readonly screen = new QuadMesh(this.output);
  private readonly source;
  private readonly state = new DisplayState();
  private readonly display = window.matchMedia("(dynamic-range: high)");
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private startedAt: number | undefined;

  constructor(source: Texture, scattering: Node) {
    this.source = texture(source);
    const atmosphere = new ConvertNode<"vec4">(scattering, "vec4");
    const radiance = Fn(() => {
      const color = this.source.rgb.toVar();
      If(this.scattering, () => {
        color.assign(atmosphere.rgb);
      });
      return color;
    })();
    const exposed = radiance.mul(this.exposure).max(0);
    const mapped = this.headroom.mul(float(1).sub(exposed.div(this.headroom).negate().exp()));
    this.material.vertexNode = this.output.vertexNode = vec4(positionGeometry.xy, 0, 1);
    const encoded = new ConvertNode<"vec3">(sRGBTransferOETF(mapped), "vec3");
    this.material.fragmentNode = vec4(encoded, 1);
    const antialiased = new ConvertNode<"vec4">(fxaa(texture(this.target.texture)), "vec4");
    const linear = new ConvertNode<"vec3">(sRGBTransferEOTF(antialiased.rgb), "vec3");
    this.output.fragmentNode = vec4(linear.mul(this.visibility), 1);
  }

  get revealing(): boolean {
    return this.visibility.value < 1;
  }

  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  render(
    renderer: Renderer,
    source: Texture,
    revision: number,
    scattering: boolean,
    changing: boolean,
  ): void {
    const now = performance.now();
    this.startedAt ??= now;
    this.visibility.value = this.reducedMotion.matches
      ? 1
      : MathUtils.smoothstep(now - this.startedAt, 0, 300);
    this.source.value = source;
    this.exposure.value = renderer.toneMappingExposure;
    this.headroom.value = this.display.matches ? 4 : 1;
    this.scattering.value = scattering;
    if (
      this.state.update(
        {
          source,
          revision,
          exposure: this.exposure.value,
          headroom: this.headroom.value,
          scattering,
        },
        changing,
      )
    ) {
      renderer.setRenderTarget(this.target);
      renderer.render(this.composite, this.composite.camera);
    }
    renderer.setRenderTarget(null);
    renderer.render(this.screen, this.screen.camera);
  }
}
