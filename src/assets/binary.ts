import { readArtifactResponseBinary } from "unified-asset-loader/application/readArtifactResponseBinary";
import type { ContentArtifactLoadProgress } from "unified-asset-loader/domain/contentArtifactLoadProgress";

export async function loadAssetBinary(
  source: { readonly url: string; readonly bytes: number },
  signal: AbortSignal,
  priority: RequestPriority,
  reportProgress?: (progress: ContentArtifactLoadProgress) => void,
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(source.url, { signal, priority });
  if (!response.ok) throw new Error(`アセットの取得に失敗しました: HTTP ${response.status}`);
  return readArtifactResponseBinary(response, source.bytes, reportProgress);
}
