import { ColorManagement, HalfFloatType, NoToneMapping, RenderTarget } from "three";
import type { Texture } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Node } from "three/webgpu";
import type { RoomRenderer } from "./room-renderer";
import { positionGeometry, sRGBTransferOETF, texture, uniform, vec4 } from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { DisplayState } from "./display-state";
import { displayTone } from "./display-tone";
import { prepareRenderTargets } from "./prepare-pass";

const hdrHeadroom = 4;

function fullscreenQuad(fragment: Node<"vec4">): QuadMesh {
  const material = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.fragmentNode = fragment;
  return new QuadMesh(material);
}

export class DisplayPass {
  private readonly staticTarget = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  private readonly motionTarget = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  private readonly filteredMotionTarget = new RenderTarget(1, 1, {
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
  private readonly motionOutput;
  private readonly source;
  private readonly state = new DisplayState();

  constructor(
    private readonly renderer: RoomRenderer,
    source: Texture,
  ) {
    this.source = texture(source);
    const mapped = displayTone(this.source.rgb, this.exposure, this.headroom);
    this.material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    const encoded = new ConvertNode<"vec3">(sRGBTransferOETF(mapped), "vec3");
    this.material.fragmentNode = vec4(encoded, 1);
    const antialiased = new ConvertNode<"vec4">(fxaa(this.antialiasSource), "vec4");
    this.pipeline = fullscreenQuad(vec4(antialiased.rgb, 1));
    this.motionOutput = fullscreenQuad(texture(this.filteredMotionTarget.texture));
  }

  async prepare(): Promise<void> {
    const renderer = this.renderer;
    const target = renderer.getRenderTarget();
    const depth = renderer.depth;
    const toneMapping = renderer.toneMapping;
    const colorSpace = renderer.outputColorSpace;
    const xr = renderer.xr.enabled;
    performance.mark("room-display-shaders-start");
    try {
      renderer.setRenderTarget(this.staticTarget);
      await renderer.compileAsync(this.composite, this.composite.camera);
      renderer.depth = false;
      renderer.toneMapping = NoToneMapping;
      renderer.outputColorSpace = ColorManagement.workingColorSpace;
      renderer.xr.enabled = false;
      renderer.setRenderTarget(null);
      await renderer.compileAsync(this.pipeline, this.pipeline.camera);
      renderer.setRenderTarget(this.filteredMotionTarget);
      await renderer.compileAsync(this.pipeline, this.pipeline.camera);
      renderer.setRenderTarget(null);
      await renderer.compileAsync(this.motionOutput, this.motionOutput.camera);
      performance.mark("room-display-shaders-ready");
    } finally {
      renderer.setRenderTarget(target);
      renderer.depth = depth;
      renderer.toneMapping = toneMapping;
      renderer.outputColorSpace = colorSpace;
      renderer.xr.enabled = xr;
    }
  }

  invalidate(): void {
    this.state.invalidate();
  }

  resizeTargets(width: number, height: number, motionWidth: number, motionHeight: number): void {
    this.staticTarget.setSize(width, height);
    this.motionTarget.setSize(motionWidth, motionHeight);
    this.filteredMotionTarget.setSize(motionWidth, motionHeight);
  }

  async prepareTargets(): Promise<void> {
    await prepareRenderTargets(this.renderer, [
      this.staticTarget,
      this.motionTarget,
      this.filteredMotionTarget,
    ]);
  }

  setSize(width: number, height: number, moving = false): void {
    this.target = moving ? this.motionTarget : this.staticTarget;
    this.target.setSize(width, height);
    if (moving) this.filteredMotionTarget.setSize(width, height);
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
      renderer.toneMapping = NoToneMapping;
      renderer.outputColorSpace = ColorManagement.workingColorSpace;
      renderer.xr.enabled = false;
      if (this.target === this.motionTarget) {
        renderer.setRenderTarget(this.filteredMotionTarget);
        renderer.render(this.pipeline, this.pipeline.camera);
        renderer.setRenderTarget(null);
        renderer.render(this.motionOutput, this.motionOutput.camera);
      } else renderer.render(this.pipeline, this.pipeline.camera);
    } finally {
      renderer.depth = depth;
      renderer.toneMapping = toneMapping;
      renderer.outputColorSpace = colorSpace;
      renderer.xr.enabled = xr;
    }
  }
}
