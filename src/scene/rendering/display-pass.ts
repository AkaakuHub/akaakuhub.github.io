import { HalfFloatType, RenderTarget } from "three";
import type { Texture } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh, RenderPipeline } from "three/webgpu";
import type { RoomRenderer } from "./room-renderer";
import { float, positionGeometry, sRGBTransferOETF, texture, uniform, vec4 } from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { DisplayState } from "./display-state";

const hdrHeadroom = 4;

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
  private readonly material = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly composite = new QuadMesh(this.material);
  private readonly pipeline;
  private readonly source;
  private readonly state = new DisplayState();

  constructor(
    private readonly renderer: RoomRenderer,
    source: Texture,
  ) {
    this.source = texture(source);
    const exposed = this.source.rgb.mul(this.exposure).max(0);
    const mapped = this.headroom.mul(float(1).sub(exposed.div(hdrHeadroom).negate().exp()));
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    const encoded = new ConvertNode<"vec3">(sRGBTransferOETF(mapped), "vec3");
    this.material.fragmentNode = vec4(encoded, 1);
    const antialiased = new ConvertNode<"vec4">(fxaa(this.antialiasSource), "vec4");
    this.pipeline = new RenderPipeline(renderer, vec4(antialiased.rgb, 1));
    this.pipeline.outputColorTransform = false;
  }

  invalidate(): void {
    this.state.invalidate();
  }

  setSize(width: number, height: number, moving = false): void {
    this.target = moving ? this.motionTarget : this.staticTarget;
    this.target.setSize(width, height);
    this.antialiasSource.value = this.target.texture;
  }

  render(source: Texture, revision: number, changing: boolean): void {
    const renderer = this.renderer;
    this.source.value = source;
    this.exposure.value = renderer.toneMappingExposure;
    this.headroom.value = renderer.hdrActive ? hdrHeadroom : 1;
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
