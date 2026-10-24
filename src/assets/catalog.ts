import manifest from "./manifest.json";

const sources = import.meta.glob<string>("./materials/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

const assetCatalog = manifest.map((entry) => {
  const url = sources[`./${entry.id}`];
  if (!url) throw new Error(`アセットが見つかりません: ${entry.id}`);
  return { ...entry, url };
});

export function asset(id: string) {
  const entry = assetCatalog.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`アセットが登録されていません: ${id}`);
  return entry;
}
