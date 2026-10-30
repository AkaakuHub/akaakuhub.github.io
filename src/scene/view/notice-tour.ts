const key = "akaakuhub:notice-tour-seen";

export class NoticeTour {
  private readonly firstVisit: boolean;
  private started = false;
  private reachedEnd = false;
  private left = false;

  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem">,
    private readonly lastIndex: number,
  ) {
    this.firstVisit = storage.getItem(key) !== "true";
  }

  get restricted(): boolean {
    return this.firstVisit && !this.reachedEnd;
  }

  get showGuide(): boolean {
    return this.firstVisit && this.started && this.reachedEnd && !this.left;
  }

  start(): void {
    if (this.started) return;
    if (this.firstVisit) this.storage.setItem(key, "true");
    this.started = true;
  }

  arrive(index: number): boolean {
    if (!this.restricted || index !== this.lastIndex) return false;
    this.reachedEnd = true;
    return true;
  }

  leave(): void {
    this.left = true;
  }
}
