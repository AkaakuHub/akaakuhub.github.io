import { HalfFloatType, SRGBColorSpace, UnsignedByteType, Vector2 } from "three";
import { Renderer, WebGPUBackend } from "three/webgpu";
import type { WebGPUBackendParameters } from "three/src/renderers/webgpu/WebGPUBackend.js";
import { ExtendedSRGBColorSpace } from "three/addons/math/ColorSpaces.js";
import { HdrPreference } from "./hdr-preference";
import { RoomNodeLibrary } from "./node-library";

export type HdrObserver = (enabled: boolean, supported: boolean) => void;

class RoomBackend extends WebGPUBackend {
  declare readonly parameters: WebGPUBackendParameters;

  setHdrEnabled(enabled: boolean): void {
    this.parameters.outputType = enabled ? HalfFloatType : UnsignedByteType;
  }
}

export class RoomRenderer extends Renderer {
  private readonly output: RoomBackend;
  private readonly preference: HdrPreference;
  private readonly display: MediaQueryList;
  private hdrObserver: (() => void) | undefined;

  constructor(canvas: HTMLCanvasElement) {
    const preference = new HdrPreference(localStorage);
    const display = window.matchMedia("(dynamic-range: high)");
    const active = preference.enabled && display.matches;
    const backend = new RoomBackend({
      canvas,
      alpha: false,
      outputType: active ? HalfFloatType : UnsignedByteType,
    });
    super(backend, { antialias: false, outputBufferType: HalfFloatType });
    this.output = backend;
    this.preference = preference;
    this.display = display;
    this.library = new RoomNodeLibrary();
    this.outputColorSpace = active ? ExtendedSRGBColorSpace : SRGBColorSpace;
    display.addEventListener("change", () => {
      this.refreshDisplay();
      this.hdrObserver?.();
    });
  }

  get hdrActive(): boolean {
    return this.preference.enabled && this.display.matches;
  }

  observeHdr(observer: HdrObserver): void {
    this.hdrObserver = () => {
      const context = this.getContext();
      const supported =
        this.display.matches &&
        context instanceof GPUCanvasContext &&
        context.getConfiguration()?.toneMapping !== undefined;
      observer(this.preference.enabled, supported);
    };
    this.hdrObserver();
  }

  toggleHdr(): boolean {
    const enabled = this.preference.toggle();
    this.refreshDisplay();
    this.hdrObserver?.();
    return enabled;
  }

  refreshDisplay(): void {
    this.output.setHdrEnabled(this.hdrActive);
    this.outputColorSpace = this.hdrActive ? ExtendedSRGBColorSpace : SRGBColorSpace;
    const size = this.getSize(new Vector2());
    this.setSize(size.x, size.y, false);
  }
}
