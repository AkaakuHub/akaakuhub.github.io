import { relativeTilt } from "./orientation";
import type { OrientationSample } from "./orientation";

function needsPermission(
  constructor: typeof DeviceOrientationEvent,
): constructor is typeof DeviceOrientationEvent & {
  requestPermission: () => Promise<"granted" | "denied">;
} {
  return "requestPermission" in constructor && typeof constructor.requestPermission === "function";
}

export function createMotionSource(
  onTilt: (x: number, y: number) => void,
  onAvailable: (available: boolean) => void,
  onEnabled: (enabled: boolean) => void,
) {
  if (!isSecureContext || typeof DeviceOrientationEvent === "undefined") return;
  const orientation = DeviceOrientationEvent;
  let available = false;
  let enabled = false;
  let origin: OrientationSample | undefined;

  function recenter(): void {
    origin = undefined;
    onTilt(0, 0);
  }
  function read(event: DeviceOrientationEvent): void {
    const { beta, gamma } = event;
    if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma))
      return;
    if (!enabled) {
      window.removeEventListener("deviceorientation", read);
      return;
    }
    if (document.hidden) return;
    const sample = { beta, gamma };
    if (!origin) {
      origin = sample;
      return;
    }
    const { x, y } = relativeTilt(sample, origin, screen.orientation.angle);
    onTilt(x, y);
  }
  function probe(): void {
    if (available) return;
    if (needsPermission(orientation)) {
      available = navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches;
      onAvailable(available);
    } else window.addEventListener("devicemotion", detectGyroscope);
  }
  function detectGyroscope(event: DeviceMotionEvent): void {
    const rate = event.rotationRate;
    if (
      !rate ||
      ![rate.alpha, rate.beta, rate.gamma].some((value) => value !== null && Number.isFinite(value))
    )
      return;
    available = true;
    onAvailable(true);
    window.removeEventListener("devicemotion", detectGyroscope);
  }
  function disable(): void {
    enabled = false;
    window.removeEventListener("deviceorientation", read);
    recenter();
    onEnabled(false);
  }
  document.addEventListener("visibilitychange", recenter);
  screen.orientation.addEventListener("change", recenter);
  window.addEventListener("pageshow", probe);
  window.addEventListener("pagehide", (event) => {
    window.removeEventListener("devicemotion", detectGyroscope);
    disable();
    if (!event.persisted) {
      document.removeEventListener("visibilitychange", recenter);
      screen.orientation.removeEventListener("change", recenter);
      window.removeEventListener("pageshow", probe);
    }
  });
  probe();
  return {
    async enable(): Promise<boolean> {
      if (!available) return false;
      if (needsPermission(orientation) && (await orientation.requestPermission()) !== "granted") {
        available = false;
        onAvailable(false);
        return false;
      }
      if (document.hidden) return false;
      recenter();
      enabled = true;
      window.addEventListener("deviceorientation", read);
      onEnabled(true);
      return true;
    },
    disable,
  };
}
