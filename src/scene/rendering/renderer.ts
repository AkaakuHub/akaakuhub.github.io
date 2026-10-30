import { HalfFloatType } from "three";
import { Renderer, WebGPUBackend } from "three/webgpu";
import { RoomNodeLibrary } from "./node-library";

export async function createRoomRenderer(canvas: HTMLCanvasElement): Promise<Renderer> {
  const renderer = new Renderer(new WebGPUBackend({ canvas, alpha: false }), {
    antialias: false,
    outputBufferType: HalfFloatType,
  });
  renderer.library = new RoomNodeLibrary();
  await renderer.init();
  return renderer;
}
