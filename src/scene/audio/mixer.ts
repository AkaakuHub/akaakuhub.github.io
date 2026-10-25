import { loadSound, soundNames } from "./assets";
import type { SoundName } from "./assets";
import { weatherMix } from "./mix";
import type { SoundWeather } from "./mix";
import { createSoundLayer } from "./layer";
import { createRoomReverb } from "./reverb";

export function createWeatherMixer(context: AudioContext) {
  const controller = new AbortController();
  const master = context.createGain();
  master.gain.value = 1;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -8;
  compressor.ratio.value = 4;
  master.connect(compressor).connect(context.destination);
  const bus = context.createGain();
  bus.connect(master);
  createRoomReverb(context, bus, master);
  const buffers = new Map<SoundName, AudioBuffer>();
  const layers = new Map<SoundName, ReturnType<typeof createSoundLayer>>();
  const pending = new Set<SoundName>();
  const failed = new Set<SoundName>();
  const stopping = new Map<SoundName, ReturnType<typeof setTimeout>>();
  let weather: SoundWeather | undefined;

  async function load(name: SoundName): Promise<void> {
    pending.add(name);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const buffer = await loadSound(context, name, controller.signal);
          if (controller.signal.aborted) return;
          buffers.set(name, buffer);
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          if (attempt === 2) throw error;
          await new Promise<void>((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
        }
      }
    } catch (error) {
      failed.add(name);
      console.error(error);
    } finally {
      pending.delete(name);
      sync();
    }
  }
  function sync(): void {
    if (!weather || controller.signal.aborted || context.state !== "running") return;
    const mix = weatherMix(weather);
    for (const name of soundNames) {
      let layer = layers.get(name);
      if (mix[name] > 0) {
        clearTimeout(stopping.get(name));
        stopping.delete(name);
        if (!layer) {
          const buffer = buffers.get(name);
          if (!buffer) {
            if (!pending.has(name) && !failed.has(name)) void load(name);
            continue;
          }
          layer = createSoundLayer(context, name, buffer, bus);
          layers.set(name, layer);
        }
        layer.volume(mix[name]);
      } else if (layer && !stopping.has(name)) {
        layer.volume(0);
        stopping.set(
          name,
          setTimeout(() => {
            layers.get(name)?.stop();
            layers.delete(name);
            stopping.delete(name);
          }, 4000),
        );
      }
    }
  }
  return {
    update(next: SoundWeather): void {
      weather = next;
      sync();
    },
    sync,
    mute(muted: boolean): void {
      master.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.03);
    },
    dispose(): void {
      controller.abort();
      for (const timer of stopping.values()) clearTimeout(timer);
      for (const layer of layers.values()) layer.stop();
      layers.clear();
      buffers.clear();
      bus.disconnect();
      master.disconnect();
      compressor.disconnect();
    },
  };
}
