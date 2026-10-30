const key = "akaakuhub:hdr-enabled";

export class HdrPreference {
  private value: boolean;

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem">) {
    this.value = storage.getItem(key) !== "false";
  }

  get enabled(): boolean {
    return this.value;
  }

  toggle(): boolean {
    const next = !this.value;
    this.storage.setItem(key, String(next));
    this.value = next;
    return next;
  }
}
