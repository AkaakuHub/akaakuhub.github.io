const backendKey = "akaakuhub:rendering-backend";
const contextRetryKey = "akaakuhub:webgl-context-retried";

export class RenderingContextLostError extends Error {
  constructor(api: string, message: string) {
    super(`${api}との接続が失われました: ${message}`);
    this.name = "RenderingContextLostError";
  }
}

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
    if (error instanceof RenderingContextLostError) return this.retryContextLoss();
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

  private retryContextLoss(): boolean {
    if (this.webgpuActive) return this.retryWebGL();
    if (this.storage.getItem(contextRetryKey) === "true") return false;
    this.storage.setItem(contextRetryKey, "true");
    this.storage.setItem(backendKey, "webgl");
    this.restarting = true;
    this.reload();
    return true;
  }
}
