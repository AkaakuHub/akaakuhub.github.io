import type { assembleClubroom } from "../../scene/clubroom";
import type { createView } from "../../scene/view";
import { photometry, unitLuminance } from "../../scene/lighting/photometry";
import { Color } from "three";

export function createComputerInterface(
  computer: Awaited<ReturnType<typeof assembleClubroom>>["computer"],
  view: ReturnType<typeof createView>,
  invalidate: () => void,
  requestFrame: () => void,
  setMonitorPower: (on: boolean) => void,
) {
  const fanFrameMs = window.matchMedia("(pointer: coarse)").matches ? 80 : 40;
  const screenColor = unitLuminance(new Color("#e8f2ff")).multiplyScalar(
    photometry.monitorNits * photometry.scale,
  );
  let powered = false;
  let fanTimer: ReturnType<typeof setTimeout> | undefined;
  let lastFanTime = 0;
  let fanStartedAt = 0;
  return {
    targets: { surfaces: computer.surfaces, screen: computer.screen.object, power: computer.power },
    togglePower(): boolean {
      powered = !powered;
      computer.power.material.emissiveIntensity = powered ? 1 : 0;
      computer.monitor.material.color.copy(powered ? screenColor : new Color("#000000"));
      lastFanTime = performance.now();
      if (powered) fanStartedAt = lastFanTime;
      else {
        clearTimeout(fanTimer);
        fanTimer = undefined;
      }
      setMonitorPower(powered);
      invalidate();
      return powered;
    },
    isPowered: () => powered,
    update(now: number): void {
      const visible =
        powered &&
        (view.state.mode === "computer" ||
          view.state.mode === "screen" ||
          (view.state.mode === "room" && view.state.direction === 1));
      if (visible && now - lastFanTime >= fanFrameMs) {
        const angle = (((now - fanStartedAt) / 1000) * Math.PI * 5) % (Math.PI * 2);
        for (const fan of computer.fans) fan.rotation.z = angle;
        lastFanTime = now;
      }
      if (visible && fanTimer === undefined)
        fanTimer = setTimeout(() => {
          fanTimer = undefined;
          requestFrame();
        }, fanFrameMs);
      if (!visible && fanTimer !== undefined) {
        clearTimeout(fanTimer);
        fanTimer = undefined;
      }
    },
  };
}
