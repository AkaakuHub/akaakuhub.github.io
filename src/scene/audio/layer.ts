import type { SoundName } from "./assets";

const locations = {
  rain: [-3.2, 2, -1],
  window: [-2.6, 1.9, 0.3],
  gutter: [-2.7, 2.5, -0.6],
  wind: [-4, 2.2, 1.5],
} satisfies Record<SoundName, readonly [number, number, number]>;
const cutoffs = { rain: 2600, window: 4800, gutter: 3200, wind: 1500 };

export function createSoundLayer(
  context: AudioContext,
  name: SoundName,
  buffer: AudioBuffer,
  output: AudioNode,
) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.playbackRate.value = 0.985 + Math.random() * 0.03;
  const gain = context.createGain();
  gain.gain.value = 0;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoffs[name];
  filter.Q.value = 0.5;
  const [x, y, z] = locations[name];
  const panner = new PannerNode(context, {
    panningModel: "HRTF",
    distanceModel: "inverse",
    refDistance: name === "wind" ? 2.8 : 1.5,
    rolloffFactor: 0.7,
    maxDistance: 20,
    positionX: x,
    positionY: y,
    positionZ: z,
  });
  const gust = context.createGain();
  gust.gain.value = 1;
  const oscillators: OscillatorNode[] = [];
  const modulation: GainNode[] = [];
  if (name === "wind") {
    for (const [frequency, amount] of [
      [0.037, 0.18],
      [0.083, 0.09],
    ] as const) {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency;
      const depth = context.createGain();
      depth.gain.value = amount;
      oscillator.connect(depth).connect(gust.gain);
      oscillator.start();
      oscillators.push(oscillator);
      modulation.push(depth);
    }
  }
  source.connect(gain).connect(filter).connect(gust).connect(panner).connect(output);
  source.start(context.currentTime, Math.random() * buffer.duration);
  return {
    volume(value: number): void {
      gain.gain.setTargetAtTime(value, context.currentTime, 0.8);
    },
    stop(): void {
      source.stop();
      for (const oscillator of oscillators) {
        oscillator.stop();
        oscillator.disconnect();
      }
      for (const node of [source, gain, filter, gust, panner, ...modulation]) node.disconnect();
    },
  };
}
