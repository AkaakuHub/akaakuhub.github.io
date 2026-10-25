import { HalfFloatType, WebGLRenderTarget } from "three";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { roomPose } from "../view/targets";

export function prewarmRoomViews(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  isMoving: () => boolean,
  onError: (error: unknown) => void,
): void {
  const directions = [1, 2, 3, 4] as const;
  const preview = camera.clone();
  const target = new WebGLRenderTarget(64, 64, { type: HalfFloatType });
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  let finished = false;
  let lastInput = performance.now();

  function markInput(): void {
    lastInput = performance.now();
  }
  function stop(): void {
    finished = true;
    clearTimeout(timer);
    target.dispose();
    for (const event of ["pointerdown", "wheel", "keydown"])
      window.removeEventListener(event, markInput, true);
    document.removeEventListener("visibilitychange", visibility);
  }
  function idle(): boolean {
    return !document.hidden && !isMoving() && performance.now() - lastInput >= 350;
  }
  async function prepare(): Promise<void> {
    if (!idle()) return;
    const direction = directions[index];
    if (direction === undefined) throw new Error("描画準備の向きが見つかりません。");
    const pose = roomPose(direction, 0, camera.aspect);
    preview.aspect = camera.aspect;
    preview.fov = pose.fov;
    preview.position.copy(pose.position);
    preview.quaternion.copy(pose.quaternion);
    preview.updateProjectionMatrix();
    const previousTarget = renderer.getRenderTarget();
    let compilation: ReturnType<WebGLRenderer["compileAsync"]>;
    try {
      renderer.setRenderTarget(target);
      compilation = renderer.compileAsync(scene, preview);
    } finally {
      renderer.setRenderTarget(previousTarget);
    }
    await compilation;
    if (!idle()) return;
    const activeTarget = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    const updateShadows = renderer.shadowMap.needsUpdate;
    try {
      renderer.autoClear = true;
      renderer.shadowMap.needsUpdate = false;
      renderer.setRenderTarget(target);
      renderer.render(scene, preview);
    } finally {
      renderer.setRenderTarget(activeTarget);
      renderer.autoClear = autoClear;
      renderer.shadowMap.needsUpdate = updateShadows;
    }
    index++;
    if (index === directions.length) stop();
  }
  function schedule(): void {
    if (finished || busy || document.hidden || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      busy = true;
      void prepare()
        .catch((error: unknown) => {
          stop();
          onError(error);
        })
        .finally(() => {
          busy = false;
          schedule();
        });
    }, 200);
  }
  function visibility(): void {
    if (document.hidden) {
      clearTimeout(timer);
      timer = undefined;
    } else schedule();
  }
  for (const event of ["pointerdown", "wheel", "keydown"])
    window.addEventListener(event, markInput, { capture: true, passive: true });
  document.addEventListener("visibilitychange", visibility);
  schedule();
}
