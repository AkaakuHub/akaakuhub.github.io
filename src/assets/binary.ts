import { createBinaryAssetLoader } from "unified-asset-loader/application/loadBinaryAsset";
import { readArtifactResponseBinary } from "unified-asset-loader/application/readArtifactResponseBinary";
import { loadBrowserArtifact } from "unified-asset-loader/browser/browserArtifactLoader";
import type { ContentArtifactLoadProgress } from "unified-asset-loader/domain/contentArtifactLoadProgress";

let opfsAvailable: Promise<boolean> | undefined;

function canUseOpfs(): Promise<boolean> {
  opfsAvailable ??= (async () => {
    if (!navigator.storage?.getDirectory) return false;
    try {
      await navigator.storage.getDirectory();
      return true;
    } catch {
      return false;
    }
  })();
  return opfsAvailable;
}

function isStorageUnavailable(cause: unknown): boolean {
  if (cause instanceof DOMException)
    return [
      "NotAllowedError",
      "SecurityError",
      "NotSupportedError",
      "QuotaExceededError",
      "InvalidStateError",
    ].includes(cause.name);
  return (
    cause instanceof Error &&
    [
      "Browser artifact cache capacity is exhausted",
      "Browser artifact cache quota is exhausted",
    ].includes(cause.message)
  );
}

export async function loadAssetBinary(
  source: {
    readonly id: string;
    readonly url: string;
    readonly bytes: number;
    readonly sha256: string;
  },
  signal: AbortSignal,
  priority: RequestPriority,
  reportProgress?: (progress: ContentArtifactLoadProgress) => void,
): Promise<Uint8Array> {
  signal.throwIfAborted();
  const useOpfs = await canUseOpfs();
  signal.throwIfAborted();
  if (useOpfs) {
    const loader = createBinaryAssetLoader({
      loader: { load: loadBrowserArtifact },
      fetch: (url, requestSignal) => fetch(url, { signal: requestSignal, priority }),
    });
    try {
      const result = await loader.load({
        source: {
          key: `akaakuhub:${source.id}`,
          url: new URL(source.url, location.href).href,
          identity: source.sha256,
          size: source.bytes,
        },
        signal,
        decode: (bytes) => bytes,
        reportProgress,
      });
      return result.value;
    } catch (cause) {
      signal.throwIfAborted();
      if (!isStorageUnavailable(cause)) throw cause;
      opfsAvailable = Promise.resolve(false);
    }
  }
  signal.throwIfAborted();
  const response = await fetch(source.url, { signal, priority });
  if (!response.ok) throw new Error(`アセットの取得に失敗しました: HTTP ${response.status}`);
  return readArtifactResponseBinary(response, source.bytes, reportProgress);
}
