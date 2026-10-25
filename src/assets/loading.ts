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
import { materialAssetIds, materialDefinitions } from "./materials";
import { areaLightAssetId } from "./lighting";
import { skillAtlasAssetId } from "./skills";
import { createImageDecoder } from "./images/decoder";

export function createRoomAssetLoader(progress: (summary: ArtifactLoadSummary) => void) {
  if (!isSecureContext || !crossOriginIsolated || !navigator.storage.getDirectory)
    throw new Error("HTTPSとクロスオリジン分離、OPFSが必要です。");
  const controller = new AbortController();
  const images = createImageDecoder();
  const initialIds = [
    ...materialAssetIds.filter((id) => id.startsWith(`materials/${materialDefinitions.paper.id}/`)),
    areaLightAssetId,
    skillAtlasAssetId,
  ];
  const initialUrls = new Set(initialIds.map((id) => new URL(asset(id).url, location.href).href));
  const { load: loadBinaryAsset } = createBinaryAssetLoader({
    loader: { load: loadBrowserArtifact },
    fetch: (url, signal) =>
      fetch(url, {
        signal,
        priority: initialUrls.has(url) ? "high" : "low",
        cache: isRecovering() ? "reload" : "default",
      }),
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
  let remaining = descriptors.size;
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
  const acquisitionOrder = [
    ...initialIds,
    ...[...descriptors.keys()].filter((id) => !initialIds.includes(id)),
  ];
  for (const id of acquisitionOrder) void fetchBytes(id).catch(abort);
  async function load<Value>(
    id: string,
    decode: (bytes: Uint8Array) => Promise<Value>,
  ): Promise<Value> {
    const descriptor = descriptors.get(id);
    if (!descriptor) throw new Error(`読み込み対象が登録されていません: ${id}`);
    const bytes = fetchBytes(id);
    descriptors.delete(id);
    try {
      return await decode(await bytes);
    } catch (cause) {
      report({
        type: "failed",
        ...descriptor,
        error: cause instanceof Error ? cause.message : String(cause),
      });
      abort(cause);
      throw cause;
    } finally {
      pending.delete(id);
      remaining--;
      if (remaining === 0) images.dispose(new Error("全画像の復号が完了しました。"));
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
