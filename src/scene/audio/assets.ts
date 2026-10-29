import { loadAssetBinary } from "../../assets/binary";
import { asset } from "../../assets/catalog";
import { prepareAudioLoop } from "./loop";

export const soundNames = ["rain", "window", "gutter", "wind", "dayRain"] as const;
export type SoundName = (typeof soundNames)[number];

export async function loadSound(
  context: BaseAudioContext,
  name: SoundName,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  const entry = asset(`audio/${name}.opus`);
  const bytes = await loadAssetBinary(
    entry,
    AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    "low",
  );
  return prepareAudioLoop(context, await context.decodeAudioData(bytes.buffer));
}
