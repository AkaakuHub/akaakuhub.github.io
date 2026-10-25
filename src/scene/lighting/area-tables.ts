import {
  DataTexture,
  DataUtils,
  FloatType,
  HalfFloatType,
  LinearFilter,
  NearestFilter,
  RGBAFormat,
  UniformsLib,
} from "three";
import type { WebGLRenderer } from "three";
import type { RoomAssetLoader } from "../../assets/loading";
import { areaLightAssetId } from "../../assets/lighting";

export async function loadAreaLightTables(renderer: WebGLRenderer, assets: RoomAssetLoader) {
  const values = await assets.load(areaLightAssetId, async (bytes) => {
    if (bytes.byteLength !== 2 * 64 * 64 * 4 * Float32Array.BYTES_PER_ELEMENT)
      throw new Error("矩形光源の参照データのサイズが不正です。");
    return new Float32Array(Uint8Array.from(bytes).buffer);
  });
  const floating = renderer.extensions.has("OES_texture_float_linear");
  function texture(offset: number): DataTexture {
    const data = values.subarray(offset, offset + 64 * 64 * 4);
    const table = new DataTexture(
      floating ? data : Uint16Array.from(data, DataUtils.toHalfFloat),
      64,
      64,
      RGBAFormat,
      floating ? FloatType : HalfFloatType,
    );
    table.minFilter = NearestFilter;
    table.magFilter = LinearFilter;
    table.needsUpdate = true;
    renderer.initTexture(table);
    return table;
  }
  const first = texture(0);
  const second = texture(64 * 64 * 4);
  Object.assign(
    UniformsLib,
    floating
      ? { LTC_FLOAT_1: first, LTC_FLOAT_2: second }
      : { LTC_HALF_1: first, LTC_HALF_2: second },
  );
}
