import { Frustum, Matrix4, Mesh } from "three";
import type { PerspectiveCamera, Scene } from "three";
import { fluorescentModulation } from "./fluorescent-modulation";

export function createFluorescentAnimation(
  scene: Scene,
  camera: PerspectiveCamera,
  setModulation: (value: number) => boolean,
  invalidate: () => void,
) {
  const tubes = scene
    .getObjectsByProperty("name", "room-fluorescent")
    .filter((object): object is Mesh => object instanceof Mesh);
  const frustum = new Frustum();
  const projection = new Matrix4();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let startedAt: number | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;

  function sample(): void {
    if (startedAt === undefined || document.hidden) return;
    camera.updateMatrixWorld();
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection, camera.coordinateSystem);
    const visible = !reducedMotion.matches && tubes.some((tube) => frustum.intersectsObject(tube));
    const level = visible ? fluorescentModulation((performance.now() - startedAt) / 1000) : 1;
    if (setModulation(level)) invalidate();
  }
  function schedule(): void {
    clearInterval(timer);
    if (startedAt === undefined) return;
    sample();
    if (!document.hidden && !reducedMotion.matches) timer = setInterval(sample, 100);
  }
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", schedule);
  window.addEventListener("pageshow", schedule);
  window.addEventListener("pagehide", () => clearInterval(timer));
  return {
    start(): void {
      startedAt ??= performance.now();
      schedule();
    },
  };
}
