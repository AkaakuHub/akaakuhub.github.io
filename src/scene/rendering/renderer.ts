import { ColorManagement, HalfFloatType } from "three";
import { Renderer, StandardNodeLibrary, WebGPUBackend } from "three/webgpu";
import {
  ExtendedSRGBColorSpace,
  ExtendedSRGBColorSpaceImpl,
} from "three/addons/math/ColorSpaces.js";

export async function createRoomRenderer(canvas: HTMLCanvasElement): Promise<Renderer> {
  ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
  const renderer = new Renderer(
    new WebGPUBackend({ canvas, alpha: false, outputType: HalfFloatType }),
    { antialias: false, outputBufferType: HalfFloatType },
  );
  renderer.library = new StandardNodeLibrary();
  renderer.outputColorSpace = ExtendedSRGBColorSpace;
  await renderer.init();
  return renderer;
}
