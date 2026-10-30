const key = "akaakuhub:rendering-errors";

interface Entry {
  time: string;
  source: string;
  detail: string;
}

export class RenderingDiagnostics {
  private readonly entries: Entry[];

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem">) {
    const saved = storage.getItem(key);
    this.entries = [];
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            if (
              typeof entry === "object" &&
              entry !== null &&
              "time" in entry &&
              typeof entry.time === "string" &&
              "source" in entry &&
              typeof entry.source === "string" &&
              "detail" in entry &&
              typeof entry.detail === "string"
            )
              this.entries.push({ time: entry.time, source: entry.source, detail: entry.detail });
          }
        }
      } catch {
        this.entries.length = 0;
      }
    }
  }

  record(error: unknown, source: string, context = ""): void {
    let failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
    if (error instanceof Error && error.cause !== undefined) {
      try {
        const cause =
          error.cause instanceof Error
            ? (error.cause.stack ?? error.cause.message)
            : JSON.stringify(error.cause, null, 2);
        failure += `\n\nCause: ${cause}`;
      } catch {
        failure += "\n\nCause: 原因オブジェクトを文字列化できませんでした。";
      }
    }
    const text = context ? `${failure}\n\n${context}` : failure;
    const detail = text.length > 48_000 ? `${text.slice(0, 48_000)}\n[記録上限により省略]` : text;
    const last = this.entries.at(-1);
    if (last?.source === source && last.detail === detail) return;
    if (this.entries.length >= 12) this.entries.splice(1, this.entries.length - 11);
    this.entries.push({ time: new Date().toISOString(), source, detail });
    try {
      this.storage.setItem(key, JSON.stringify(this.entries));
    } catch {
      /* 保存できなくても現在のページの記録は保持する。 */
    }
  }

  report(): string {
    return this.entries
      .map((entry, index) => `[${index + 1}] ${entry.time} ${entry.source}\n${entry.detail}`)
      .join("\n\n");
  }
}
