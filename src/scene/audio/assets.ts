import { createBinaryAssetLoader } from "unified-asset-loader/application/loadBinaryAsset";
import { loadBrowserArtifact } from "unified-asset-loader/browser/browserArtifactLoader";
import { asset } from "../../assets/catalog";
import { isRecovering } from "../../interface/recovery";
import { prepareAudioLoop } from "./loop";

export const soundNames = ["rain", "window", "gutter", "wind"] as const;
export type SoundName = (typeof soundNames)[number];

const loader = createBinaryAssetLoader({
  loader: { load: loadBrowserArtifact },
  fetch: (url, signal) =>
    fetch(url, { signal, priority: "low", cache: isRecovering() ? "reload" : "default" }),
});

export async function loadSound(
  context: BaseAudioContext,
  name: SoundName,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  const entry = asset(`audio/${name}.opus`);
  const result = await loader.load({
    source: {
      key: `akaakuhub:audio:${name}`,
      url: new URL(entry.url, location.href).href,
      identity: entry.sha256,
      size: entry.bytes,
    },
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    decode: async (bytes) =>
      prepareAudioLoop(context, await context.decodeAudioData(Uint8Array.from(bytes).buffer)),
  });
  return result.value;
}
