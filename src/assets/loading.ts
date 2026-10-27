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
import { asset } from "./catalog";
import members from "./room-manifest.json";
import { unpackAsset } from "./packing";
import { createImageDecoder } from "./images/decoder";

export function createRoomAssetLoader(progress: (summary: ArtifactLoadSummary) => void) {
  if (!isSecureContext || !crossOriginIsolated || !navigator.storage.getDirectory)
    throw new Error("HTTPSとクロスオリジン分離、OPFSが必要です。");
  const controller = new AbortController();
  const images = createImageDecoder();
  const initialUrl = new URL(asset("room/initial.bin").url, location.href).href;
  const { load: loadBinaryAsset } = createBinaryAssetLoader({
    loader: { load: loadBrowserArtifact },
    fetch: (url, signal) =>
      fetch(url, {
        signal,
        priority: url === initialUrl ? "high" : "low",
      }),
  });
  let state: ArtifactLoadEntryState = new Map();
  const descriptors = new Map(
    [...new Set(members.map((member) => member.pack))].map((id) => [
      id,
      {
        identity: `akaakuhub:${id}`,
        assetType: "binary",
        label: id,
      },
    ]),
  );
  function report(event: ArtifactLoadEntryEvent): void {
    state = reduceArtifactLoadEntryEvent(state, event);
    progress(resolveArtifactLoadSummary([...state.values()]));
  }
  for (const descriptor of descriptors.values()) report({ type: "started", ...descriptor });
  const entries = new Map(members.map((member) => [member.id, member]));
  let remaining = entries.size;
  const pending = new Map<string, Promise<Uint8Array>>();
  function abort(cause: unknown): void {
    if (controller.signal.aborted) return;
    controller.abort(cause);
    images.dispose(cause instanceof Error ? cause : new Error(String(cause)));
  }
  function fetchBytes(id: string): Promise<Uint8Array> {
    const existing = pending.get(id);
    if (existing) return existing;
    const descriptor = descriptors.get(id);
    if (!descriptor) throw new Error(`読み込み対象が登録されていません: ${id}`);
    const entry = asset(id);
    const result = runArtifactLoadStep(
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
          decode: async (bytes) => bytes,
          reportProgress,
          reportCacheWriteFailure,
        }),
    ).then((result) => result.value);
    pending.set(id, result);
    return result;
  }
  for (const id of descriptors.keys()) void fetchBytes(id).catch(abort);
  async function load<Value>(
    id: string,
    decode: (bytes: Uint8Array) => Promise<Value>,
  ): Promise<Value> {
    const entry = entries.get(id);
    if (!entry) throw new Error(`読み込み対象が登録されていません: ${id}`);
    const descriptor = descriptors.get(entry.pack);
    if (!descriptor) throw new Error(`アセットの梱包が登録されていません: ${entry.pack}`);
    entries.delete(id);
    try {
      return await decode(unpackAsset(await fetchBytes(entry.pack), entry));
    } catch (cause) {
      report({
        type: "failed",
        ...descriptor,
        error: cause instanceof Error ? cause.message : String(cause),
      });
      abort(cause);
      throw cause;
    } finally {
      remaining--;
      if (remaining === 0) {
        pending.clear();
        images.dispose(new Error("全画像の復号が完了しました。"));
      }
    }
  }
  return {
    abort,
    load,
    loadImage: (id: string, options: ImageBitmapOptions) =>
      load(id, (bytes) => images.decode(bytes, options)),
  };
}

export type RoomAssetLoader = ReturnType<typeof createRoomAssetLoader>;
