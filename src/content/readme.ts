export type ReadmeState =
  | { status: "loading" | "error" }
  | { status: "ready"; text: string | null };

export async function loadReadme(name: string): Promise<string | null> {
  const response = await fetch(`/api/readme/${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`READMEを取得できませんでした: HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("text" in value) ||
    (value.text !== null && (typeof value.text !== "string" || value.text.length > 1200))
  )
    throw new Error("READMEの形式が不正です。");
  return value.text;
}
