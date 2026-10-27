interface PackMember {
  offset: number;
  bytes: number;
}

export function createAssetPack(sources: readonly { id: string; bytes: Uint8Array }[]) {
  const ids = new Set<string>();
  let size = 0;
  const entries = sources.map((source) => {
    if (ids.has(source.id) || source.bytes.byteLength === 0)
      throw new Error(`梱包するアセットが不正です: ${source.id}`);
    ids.add(source.id);
    const offset = Math.ceil(size / 8) * 8;
    size = offset + source.bytes.byteLength;
    return { id: source.id, offset, bytes: source.bytes.byteLength };
  });
  const bytes = new Uint8Array(size);
  entries.forEach((entry, index) => {
    const source = sources[index];
    if (!source) throw new Error("梱包元のアセットがありません。");
    bytes.set(source.bytes, entry.offset);
  });
  return { bytes, entries };
}

export function unpackAsset(pack: Uint8Array, member: PackMember): Uint8Array {
  if (
    !Number.isSafeInteger(member.offset) ||
    !Number.isSafeInteger(member.bytes) ||
    member.offset < 0 ||
    member.bytes <= 0 ||
    member.offset + member.bytes > pack.byteLength
  )
    throw new Error("梱包したアセットの範囲が不正です。");
  return pack.subarray(member.offset, member.offset + member.bytes);
}
