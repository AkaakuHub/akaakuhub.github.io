import {
  reduceArtifactLoadEntryEvent,
  resolveArtifactLoadSummary,
  runArtifactLoadStep,
} from "unified-asset-loader";
import type {
  ArtifactLoadEntryEvent,
  ArtifactLoadEntryState,
  ArtifactLoadSummary,
} from "unified-asset-loader";
import { loadBinaryAsset } from "unified-asset-loader/browser";
import { asset } from "./catalog";
import { materialAssetIds } from "./materials";

export function createRoomAssetLoader(progress: (summary: ArtifactLoadSummary) => void) {
  if (!isSecureContext || !crossOriginIsolated || !navigator.storage.getDirectory)
    throw new Error("HTTPSとクロスオリジン分離、OPFSが必要です。");
  const controller = new AbortController();
  let state: ArtifactLoadEntryState = new Map();
  const descriptors = new Map(
    [...materialAssetIds, "lighting/fluorescent.data"].map((id) => [
      id,
      {
        identity: `akaakuhub:${id}`,
        assetType: id.endsWith(".webp") ? "image" : "lighting",
        label: id,
      },
    ]),
  );
  function report(event: ArtifactLoadEntryEvent): void {
    state = reduceArtifactLoadEntryEvent(state, event);
    progress(resolveArtifactLoadSummary([...state.values()]));
  }
  for (const descriptor of descriptors.values()) report({ type: "started", ...descriptor });
  return {
    async load<Value>(id: string, decode: (bytes: Uint8Array) => Promise<Value>): Promise<Value> {
      const entry = asset(id);
      const descriptor = descriptors.get(id);
      if (!descriptor) throw new Error(`読み込み対象が登録されていません: ${id}`);
      try {
        const result = await runArtifactLoadStep(
          descriptor,
          report,
          (reportProgress, reportCacheWriteFailure) =>
            loadBinaryAsset({
              source: {
                key: descriptor.identity,
                url: new URL(entry.url, location.href).href,
                identity: entry.sha256,
                size: entry.bytes,
              },
              signal: controller.signal,
              decode,
              reportProgress,
              reportCacheWriteFailure,
            }),
        );
        return result.value;
      } catch (cause) {
        controller.abort(cause);
        throw cause;
      }
    },
  };
}

export type RoomAssetLoader = ReturnType<typeof createRoomAssetLoader>;
