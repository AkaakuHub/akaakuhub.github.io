import { HalfFloatType, SRGBColorSpace, Vector2 } from "three";
import { Renderer, WebGLBackend, WebGPUBackend } from "three/webgpu";
import type { WebGPUBackendParameters } from "three/src/renderers/webgpu/WebGPUBackend.js";
import { ExtendedSRGBColorSpace } from "three/addons/math/ColorSpaces.js";
import { HdrPreference } from "./hdr-preference";
import { RoomNodeLibrary } from "./node-library";
import { completeWebGLFrame } from "./webgl-frame";
import { renderingDiagnostics, renderingSession } from "./session";
import { RenderingContextLostError } from "./recovery";

export type HdrObserver = (enabled: boolean, supported: boolean) => void;

class RoomBackend extends WebGPUBackend {
  declare readonly parameters: WebGPUBackendParameters;
  declare readonly device: GPUDevice | null;

  setHdrEnabled(enabled: boolean): void {
    this.parameters.outputType = enabled ? HalfFloatType : undefined;
  }
}

export class RoomRenderer extends Renderer {
  readonly compileYieldInterval = renderingSession.forceWebGL ? 0 : 12;
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
      outputType: active ? HalfFloatType : undefined,
    });
    const forceWebGL = renderingSession.forceWebGL;
    super(forceWebGL ? new WebGLBackend({ canvas }) : backend, {
      alpha: false,
      antialias: false,
      outputBufferType: HalfFloatType,
      getFallback: forceWebGL
        ? null
        : (error: unknown) => {
            renderingDiagnostics.record(error, "WebGPU initialization failed");
            return new WebGLBackend({ canvas });
          },
    });
    this.onError = (error: unknown) => {
      renderingDiagnostics.record(
        error instanceof Error
          ? error
          : new Error(typeof error === "string" ? error : JSON.stringify(error)),
        "WebGPU initialization error",
      );
    };
    this.onDeviceLost = (info) => {
      const error = new RenderingContextLostError(info.api, info.message);
      renderingDiagnostics.record(
        error,
        "GPU lost during initialization",
        `Reason: ${info.reason}`,
      );
      renderingSession.recover(error);
    };
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
    return this.backend === this.output && this.preference.enabled && this.display.matches;
  }

  completedFrame(): Promise<void> {
    if (this.backend instanceof WebGLBackend) {
      const context = this.getContext();
      if (!(context instanceof WebGL2RenderingContext))
        throw new Error("WebGL 2が初期化されていません。");
      return completeWebGLFrame(context);
    }
    const device = this.output.device;
    if (!device) throw new Error("GPUが初期化されていません。");
    return device.queue.onSubmittedWorkDone();
  }

  observeHdr(observer: HdrObserver): void {
    this.hdrObserver = () => {
      const context = this.getContext();
      const supported =
        this.backend === this.output &&
        this.display.matches &&
        typeof GPUCanvasContext !== "undefined" &&
        context instanceof GPUCanvasContext &&
        typeof context.getConfiguration === "function" &&
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
