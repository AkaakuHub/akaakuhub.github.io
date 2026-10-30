import type { PerspectiveCamera } from "three";
import type { createWeatherMixer } from "./mixer";
import type { SoundWeather } from "./mix";
import { hasWeatherSound } from "./availability";
import { createListenerUpdater } from "./listener";
import type { ListenerPose } from "./listener";

export type WeatherAudio = ReturnType<typeof createWeatherAudio>;

export function createWeatherAudio() {
  let context: AudioContext | undefined;
  let mixer: ReturnType<typeof createWeatherMixer> | undefined;
  let mixerReady: Promise<void> | undefined;
  let weather: SoundWeather | undefined;
  let ready = false;
  let muted = true;
  let available = false;
  let onAvailable: ((available: boolean) => void) | undefined;
  let disposed = false;
  let onMute: ((muted: boolean) => void) | undefined;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;
  let pose: ListenerPose = [0, 0, 0, 0, 0, -1, 0, 1, 0];
  let updateListener: ReturnType<typeof createListenerUpdater> | undefined;

  function applyPose(): void {
    if (context?.state === "running") updateListener?.(pose, context.currentTime);
  }
  function sync(): void {
    if (!ready || muted || document.hidden || !weather || !mixer || context?.state !== "running")
      return;
    mixer.update(weather);
    applyPose();
  }
  function unlock(): void {
    if (disposed || muted || !available) return;
    clearTimeout(suspendTimer);
    if (!context) {
      context = new AudioContext({ latencyHint: "interactive" });
      updateListener = createListenerUpdater(context.listener);
      context.addEventListener("statechange", sync);
    }
    const activeContext = context;
    mixerReady ??= import("./mixer").then(({ createWeatherMixer }) => {
      if (disposed) return;
      mixer = createWeatherMixer(activeContext);
      mixer.mute(muted);
      sync();
    });
    void mixerReady.catch(console.error);
    mixer?.mute(false);
    void context
      .resume()
      .then(sync)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== "NotAllowedError")
          console.error(error);
      });
  }
  function toggleMuted(): void {
    if (!available) return;
    muted = !muted;
    onMute?.(muted);
    clearTimeout(suspendTimer);
    if (muted) {
      mixer?.mute(true);
      suspendTimer = setTimeout(() => {
        if (context?.state === "running") void context.suspend().catch(console.error);
      }, 150);
    } else unlock();
  }
  function interact(event: Event): void {
    if (!event.isTrusted) return;
    if (
      event instanceof KeyboardEvent &&
      event.key.toLowerCase() === "m" &&
      !event.repeat &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      toggleMuted();
    } else unlock();
  }
  for (const event of ["pointerdown", "pointerup", "keydown"])
    window.addEventListener(event, interact, true);
  document.addEventListener("visibilitychange", () => {
    if (!context || disposed) return;
    if (document.hidden) void context.suspend().catch(console.error);
    else if (!muted) unlock();
  });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      if (context) void context.suspend().catch(console.error);
      return;
    }
    disposed = true;
    clearTimeout(suspendTimer);
    for (const type of ["pointerdown", "pointerup", "keydown"])
      window.removeEventListener(type, interact, true);
    mixer?.dispose();
    if (context) void context.close().catch(console.error);
  });
  window.addEventListener("pageshow", () => {
    if (context && !muted && !disposed) unlock();
  });
  if (navigator.userActivation.hasBeenActive) unlock();
  return {
    start(): void {
      ready = true;
      sync();
    },
    updateWeather(next: SoundWeather): void {
      weather = next;
      const nextAvailable = hasWeatherSound(next);
      if (nextAvailable !== available) {
        available = nextAvailable;
        onAvailable?.(available);
        mixer?.mute(muted || !available);
        if (!available && context?.state === "running") void context.suspend().catch(console.error);
        else if (available && !muted) unlock();
      }
      sync();
    },
    updateCamera(camera: PerspectiveCamera): void {
      camera.updateMatrixWorld();
      const m = camera.matrixWorld.elements;
      pose = [m[12], m[13], m[14], -m[8], -m[9], -m[10], m[4], m[5], m[6]];
      applyPose();
    },
    bindMute(callback: (muted: boolean) => void): void {
      onMute = callback;
      callback(muted);
    },
    bindAvailable(callback: (available: boolean) => void): void {
      onAvailable = callback;
      callback(available);
    },
    toggleMuted,
  };
}
