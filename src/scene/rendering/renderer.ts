import { ColorManagement } from "three";
import {
  ExtendedSRGBColorSpace,
  ExtendedSRGBColorSpaceImpl,
} from "three/addons/math/ColorSpaces.js";
import { RoomRenderer } from "./room-renderer";

export async function createRoomRenderer(canvas: HTMLCanvasElement): Promise<RoomRenderer> {
  ColorManagement.define({ [ExtendedSRGBColorSpace]: ExtendedSRGBColorSpaceImpl });
  const renderer = new RoomRenderer(canvas);
  await renderer.init();
  return renderer;
}
