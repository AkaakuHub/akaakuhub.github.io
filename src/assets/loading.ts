import { runArtifactLoadStep } from "unified-asset-loader/application/artifactLoadWorkflow";
import { reduceArtifactLoadEntryEvent } from "unified-asset-loader/domain/artifactLoadEntryState";
import type {
  ArtifactLoadEntryEvent,
  ArtifactLoadEntryState,
} from "unified-asset-loader/domain/artifactLoadEntryState";
import { resolveArtifactLoadSummary } from "unified-asset-loader/domain/artifactLoadSummary";
import type { ArtifactLoadSummary } from "unified-asset-loader/domain/artifactLoadSummary";
import { createBinaryAssetLoader } from "unified-asset-loader/application/loadBinaryAsset";
import { loadBrowserArtifact } from "unified-asset-loader/browser/browserArtifactLoader";
import { isRecovering } from "../interface/recovery";
import { asset } from "./catalog";
import { materialAssetIds } from "./materials";
import { areaLightAssetId } from "./lighting";
import { skillAtlasAssetId } from "./skills";
import { createDecodeSlot } from "./decode-slot";

export function createRoomAssetLoader(progress: (summary: ArtifactLoadSummary) => void) {
  if (!isSecureContext || !crossOriginIsolated || !navigator.storage.getDirectory)
    throw new Error("HTTPSとクロスオリジン分離、OPFSが必要です。");
  const controller = new AbortController();
  const { load: loadBinaryAsset } = createBinaryAssetLoader({
    loader: { load: loadBrowserArtifact },
    fetch: (url, signal) =>
      fetch(url, { signal, priority: "low", cache: isRecovering() ? "reload" : "default" }),
  });
  let state: ArtifactLoadEntryState = new Map();
  const descriptors = new Map(
    [...materialAssetIds, areaLightAssetId, skillAtlasAssetId].map((id) => [
      id,
      {
        identity: `akaakuhub:${id}`,
        assetType: id === areaLightAssetId ? "binary" : "image",
        label: id,
      },
    ]),
  );
  function report(event: ArtifactLoadEntryEvent): void {
    state = reduceArtifactLoadEntryEvent(state, event);
    progress(resolveArtifactLoadSummary([...state.values()]));
  }
  for (const descriptor of descriptors.values()) report({ type: "started", ...descriptor });
  const entries = new Map(
    [...descriptors].map(([id, descriptor]) => {
      const entry = asset(id);
      const slot = createDecodeSlot();
      const completed = runArtifactLoadStep(
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
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45_000)]),
            decode: slot.run,
            reportProgress,
            reportCacheWriteFailure,
          }),
      ).then(() => {});
      void completed.catch(abort);
      return [id, { slot, completed }] as const;
    }),
  );
  function abort(cause: unknown): void {
    if (controller.signal.aborted) return;
    controller.abort(cause);
    for (const { slot } of entries.values()) slot.cancel(cause);
  }
  return {
    abort,
    async load<Value>(id: string, decode: (bytes: Uint8Array) => Promise<Value>): Promise<Value> {
      const entry = entries.get(id);
      if (!entry) throw new Error(`読み込み対象が登録されていません: ${id}`);
      try {
        return await entry.slot.claim(decode, entry.completed);
      } catch (cause) {
        abort(cause);
        throw cause;
      } finally {
        entries.delete(id);
      }
    },
  };
}

export type RoomAssetLoader = ReturnType<typeof createRoomAssetLoader>;
