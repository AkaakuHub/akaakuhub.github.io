import { browserArtifactOpfsDirectoryName } from "unified-asset-loader/browser/browserArtifactOpfs";

const key = "akaakuhub:reload";

export function recoveryReason(): string | null {
  return sessionStorage.getItem(key);
}

export function errorDetails(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const message = error.stack ? error.stack : `${error.name}: ${error.message}`;
  return error.cause ? `${message}\n\n原因: ${errorDetails(error.cause)}` : message;
}

export async function prepareRecovery(): Promise<void> {
  if (!recoveryReason()) return;
  const root = await navigator.storage.getDirectory();
  try {
    await root.removeEntry(browserArtifactOpfsDirectoryName, { recursive: true });
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error;
  }
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

export async function reloadEverything(reason: string): Promise<void> {
  sessionStorage.setItem(key, reason);
  const response = await fetch("/api/reload", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`キャッシュを消去できませんでした: HTTP ${response.status}`);
  const url = new URL(location.href);
  url.searchParams.set("reload", String(Date.now()));
  location.replace(url);
}

export function finishRecovery(): void {
  sessionStorage.removeItem(key);
  const url = new URL(location.href);
  url.searchParams.delete("reload");
  history.replaceState(history.state, "", url);
}
