import type { Renderer } from "three/webgpu";

export function createFrameMetrics(renderer: Renderer) {
  renderer.info.autoReset = false;
  let tracking = false;
  let started = 0;
  let frameStarted = 0;
  let frames = 0;
  let maximumCpuMs = 0;
  let maximumTriangles = 0;
  let maximumCalls = 0;
  return {
    begin(moving: boolean): void {
      frameStarted = performance.now();
      renderer.info.reset();
      if (moving && !tracking) {
        tracking = true;
        started = frameStarted;
        frames = 0;
        maximumCpuMs = 0;
        maximumTriangles = 0;
        maximumCalls = 0;
      }
    },
    end(moving: boolean): void {
      if (!tracking) return;
      frames++;
      const now = performance.now();
      maximumCpuMs = Math.max(maximumCpuMs, now - frameStarted);
      maximumTriangles = Math.max(maximumTriangles, renderer.info.render.triangles);
      maximumCalls = Math.max(maximumCalls, renderer.info.render.calls);
      if (!moving) {
        console.info(
          "[scene-frame]",
          JSON.stringify({
            frames,
            elapsedMs: Math.round(now - started),
            averageFrameMs: Number(((now - started) / frames).toFixed(1)),
            maximumCpuMs: Number(maximumCpuMs.toFixed(1)),
            maximumTriangles,
            maximumCalls,
          }),
        );
        tracking = false;
      }
    },
  };
}
