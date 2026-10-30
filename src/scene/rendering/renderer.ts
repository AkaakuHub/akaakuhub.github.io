import { ColorManagement, HalfFloatType } from "three";
import { Renderer, WebGPUBackend } from "three/webgpu";
import {
  ExtendedSRGBColorSpace,
  ExtendedSRGBColorSpaceImpl,
} from "three/addons/math/ColorSpaces.js";
import { RoomNodeLibrary } from "./node-library";

export async function createRoomRenderer(canvas: HTMLCanvasElement): Promise<Renderer> {
  ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
  const renderer = new Renderer(
    new WebGPUBackend({ canvas, alpha: false, outputType: HalfFloatType }),
    { antialias: false, outputBufferType: HalfFloatType },
  );
  renderer.library = new RoomNodeLibrary();
  renderer.outputColorSpace = ExtendedSRGBColorSpace;
  await renderer.init();
  return renderer;
}
