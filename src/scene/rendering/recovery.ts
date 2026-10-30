const backendKey = "akaakuhub:rendering-backend";

export class RenderingRecovery {
  private webgpuActive: boolean;
  private restarting = false;
  readonly forceWebGL: boolean;

  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem">,
    private readonly reload: () => void,
  ) {
    this.forceWebGL = storage.getItem(backendKey) === "webgl";
    this.webgpuActive = !this.forceWebGL;
  }

  setWebGPUActive(active: boolean): void {
    this.webgpuActive = active;
  }

  recover(error: unknown): boolean {
    if (this.restarting) return true;
    const message = error instanceof Error ? error.message : error;
    if (
      typeof message !== "string" ||
      (!message.includes("Instance dropped in popErrorScope") &&
        !message.includes("A valid external Instance reference no longer exists"))
    )
      return false;
    return this.retryWebGL();
  }

  retryWebGL(): boolean {
    if (this.restarting) return true;
    if (!this.webgpuActive || this.forceWebGL) return false;
    this.storage.setItem(backendKey, "webgl");
    this.restarting = true;
    this.reload();
    return true;
  }
}
