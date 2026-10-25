export function prepareAudioLoop(context: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const overlap = Math.round(buffer.sampleRate * 0.06);
  if (buffer.length <= overlap * 2) throw new Error("環境音が短すぎます。");
  const result = context.createBuffer(
    buffer.numberOfChannels,
    buffer.length - overlap,
    buffer.sampleRate,
  );
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    output.set(source.subarray(overlap));
    for (const [index, head] of source.subarray(0, overlap).entries()) {
      const tail = source[source.length - overlap + index];
      if (tail === undefined) throw new Error("環境音の継ぎ目を処理できませんでした。");
      const angle = (((index + 0.5) / overlap) * Math.PI) / 2;
      output[output.length - overlap + index] = tail * Math.cos(angle) + head * Math.sin(angle);
    }
  }
  return result;
}
