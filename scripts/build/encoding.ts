export function acceptsBrotli(header: string | undefined): boolean {
  if (!header) return false;
  const qualities = new Map(
    header.split(",").map((entry): [string, number] => {
      const [name = "", ...parameters] = entry.trim().toLowerCase().split(";");
      const parameter = parameters.map((part) => part.trim()).find((part) => part.startsWith("q="));
      const quality = parameter === undefined ? 1 : Number(parameter.slice(2));
      return [name.trim(), Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0];
    }),
  );
  const wildcard = qualities.get("*") ?? 0;
  const brotli = qualities.get("br") ?? wildcard;
  return (
    brotli > 0 &&
    brotli >= (qualities.get("gzip") ?? wildcard) &&
    brotli >= (qualities.get("identity") ?? 0)
  );
}
