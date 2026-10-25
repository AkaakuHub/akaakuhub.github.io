export function createRoomReverb(
  context: BaseAudioContext,
  input: AudioNode,
  output: AudioNode,
): void {
  const convolver = context.createConvolver();
  const length = Math.ceil(context.sampleRate * 0.32);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  let seed = 9719;
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const seconds = index / context.sampleRate;
      data[index] = seconds > 0.012 ? (seed / 2147483648 - 1) * Math.exp(-seconds * 22) * 0.1 : 0;
    }
    for (const [delay, gain] of [
      [0.017, 0.3],
      [0.029, 0.2],
      [0.043, 0.12],
    ] as const)
      data[Math.round((delay + channel * 0.0017) * context.sampleRate)] = gain;
  }
  convolver.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = 0.14;
  input.connect(convolver).connect(wet).connect(output);
}
