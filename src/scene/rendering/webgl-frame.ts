import { RenderingContextLostError } from "./recovery";

type FrameContext = Pick<
  WebGL2RenderingContext,
  | "fenceSync"
  | "flush"
  | "clientWaitSync"
  | "deleteSync"
  | "SYNC_GPU_COMMANDS_COMPLETE"
  | "TIMEOUT_EXPIRED"
  | "WAIT_FAILED"
  | "isContextLost"
>;

export function completeWebGLFrame(gl: FrameContext): Promise<void> {
  const failure = (): Error =>
    gl.isContextLost()
      ? new RenderingContextLostError("WebGL", "描画完了の確認中に接続が失われました。")
      : new Error("WebGLの描画完了を確認できませんでした。");
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) return Promise.reject(failure());
  gl.flush();
  return new Promise<void>((resolve, reject) => {
    const check = (): void => {
      if (gl.isContextLost()) {
        gl.deleteSync(sync);
        reject(failure());
        return;
      }
      const status = gl.clientWaitSync(sync, 0, 0);
      if (status === gl.TIMEOUT_EXPIRED) {
        setTimeout(check, 4);
        return;
      }
      gl.deleteSync(sync);
      if (status === gl.WAIT_FAILED) reject(failure());
      else resolve();
    };
    check();
  });
}
