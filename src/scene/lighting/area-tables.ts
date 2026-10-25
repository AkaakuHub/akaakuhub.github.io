import { DataTexture, HalfFloatType, LinearFilter, RGBAFormat } from "three";
import { RectAreaLightNode } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import type { RoomAssetLoader } from "../../assets/loading";
import { areaLightAssetId } from "../../assets/lighting";

export async function loadAreaLightTables(
  rendererReady: Promise<Renderer>,
  assets: RoomAssetLoader,
) {
  const values = await assets.load(areaLightAssetId, async (bytes) => {
    if (bytes.byteLength !== 2 * 64 * 64 * 4 * Uint16Array.BYTES_PER_ELEMENT)
      throw new Error("矩形光源の参照データのサイズが不正です。");
    return new Uint16Array(Uint8Array.from(bytes).buffer);
  });
  const renderer = await rendererReady;
  function table(offset: number): DataTexture {
    const data = values.subarray(offset, offset + 64 * 64 * 4);
    const result = new DataTexture(data, 64, 64, RGBAFormat, HalfFloatType);
    result.minFilter = result.magFilter = LinearFilter;
    result.needsUpdate = true;
    renderer.initTexture(result);
    return result;
  }
  const first = table(0);
  const second = table(64 * 64 * 4);
  RectAreaLightNode.setLTC({
    LTC_FLOAT_1: first,
    LTC_FLOAT_2: second,
    LTC_HALF_1: first,
    LTC_HALF_2: second,
  });
}
