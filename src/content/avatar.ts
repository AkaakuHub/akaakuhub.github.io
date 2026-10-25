import { profile } from "./profile";

export async function loadProfileAvatar(): Promise<ImageBitmap> {
  const response = await fetch(profile.avatar, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok)
    throw new Error(`GitHubのアイコンを取得できませんでした: HTTP ${response.status}`);
  return createImageBitmap(await response.blob());
}
