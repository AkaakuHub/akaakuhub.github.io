import { ColorManagement, PCFShadowMap } from "three";
import {
  ExtendedSRGBColorSpace,
  ExtendedSRGBColorSpaceImpl,
} from "three/addons/math/ColorSpaces.js";
import { RoomRenderer } from "./room-renderer";
import { WebGPUBackend } from "three/webgpu";
import { renderingSession } from "./session";
import { bindRenderingErrors } from "./errors";

export async function createRoomRenderer(
  canvas: HTMLCanvasElement,
  recover: (error: unknown) => void,
): Promise<RoomRenderer> {
  ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
  const renderer = new RoomRenderer(canvas);
  await renderer.init();
  renderingSession.setWebGPUActive(renderer.backend instanceof WebGPUBackend);
  renderer.refreshDisplay();
  bindRenderingErrors(renderer, recover);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  performance.mark("room-renderer-ready");
  return renderer;
}
