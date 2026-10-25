import { browserArtifactOpfsDirectoryName } from "unified-asset-loader/browser/browserArtifactOpfs";

import { reserveRetry, retryLimit, retryWindowMs } from "./retry-policy";
import type { RetryState } from "./retry-policy";

const key = "akaakuhub:recovery-attempts";

function retryState(): RetryState | null {
  const serialized = sessionStorage.getItem(key);
  if (!serialized) return null;
  const value: unknown = JSON.parse(serialized);
  if (
    typeof value !== "object" ||
    value === null ||
    !("startedAt" in value) ||
    !("attempts" in value) ||
    typeof value.startedAt !== "number" ||
    !Number.isSafeInteger(value.startedAt) ||
    typeof value.attempts !== "number" ||
    !Number.isSafeInteger(value.attempts) ||
    value.attempts < 0 ||
    value.attempts > retryLimit
  )
    throw new Error("再試行の記録が不正です。");
  if (Date.now() - value.startedAt >= retryWindowMs) {
    sessionStorage.removeItem(key);
    return null;
  }
  return { startedAt: value.startedAt, attempts: value.attempts };
}

export function isRecovering(): boolean {
  return retryState() !== null;
}

export function retryAvailableAt(): number {
  const state = retryState();
  return state && state.attempts >= retryLimit ? state.startedAt + retryWindowMs : Date.now();
}

export function retryDelay(): number {
  const state = retryState();
  return 1000 * 2 ** (state ? state.attempts : 0);
}

export async function prepareRecovery(): Promise<void> {
  if (!isRecovering()) return;
  const root = await navigator.storage.getDirectory();
  try {
    await root.removeEntry(browserArtifactOpfsDirectoryName, { recursive: true });
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error;
  }
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

export async function reloadEverything(automatic: boolean): Promise<boolean> {
  const current = retryState();
  const state = automatic
    ? reserveRetry(current, Date.now())
    : (current ?? { startedAt: Date.now(), attempts: 0 });
  if (!state) return false;
  sessionStorage.setItem(key, JSON.stringify(state));
  const response = await fetch("/api/reload", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`キャッシュを消去できませんでした: HTTP ${response.status}`);
  const url = new URL(location.href);
  url.searchParams.set("reload", String(Date.now()));
  location.replace(url);
  return true;
}

export function finishRecovery(): void {
  sessionStorage.removeItem(key);
  const url = new URL(location.href);
  url.searchParams.delete("reload");
  history.replaceState(history.state, "", url);
}
