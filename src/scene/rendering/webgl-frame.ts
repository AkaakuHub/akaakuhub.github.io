type FrameContext = Pick<
  WebGL2RenderingContext,
  | "fenceSync"
  | "flush"
  | "clientWaitSync"
  | "deleteSync"
  | "SYNC_GPU_COMMANDS_COMPLETE"
  | "TIMEOUT_EXPIRED"
  | "WAIT_FAILED"
>;

export function completeWebGLFrame(gl: FrameContext): Promise<void> {
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) return Promise.reject(new Error("WebGLの描画完了を確認できませんでした。"));
  gl.flush();
  return new Promise<void>((resolve, reject) => {
    const check = (): void => {
      const status = gl.clientWaitSync(sync, 0, 0);
      if (status === gl.TIMEOUT_EXPIRED) {
        setTimeout(check, 4);
        return;
      }
      gl.deleteSync(sync);
      if (status === gl.WAIT_FAILED) reject(new Error("WebGLの描画処理に失敗しました。"));
      else resolve();
    };
    check();
  });
}
