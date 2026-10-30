const key = "akaakuhub:rendering-errors";

interface Entry {
  time: string;
  source: string;
  detail: string;
}

function compact(text: string): string {
  const withoutShaders = text.replace(
    /(?:Vertex source:|Fragment source:|Translated vertex:|Translated fragment:)[\s\S]*?(?=\n\s+at |$)/g,
    "[シェーダー全文は省略]",
  );
  let frames = 0;
  const result = withoutShaders
    .split("\n")
    .filter((line) => {
      if (!/^\s+at /.test(line)) return true;
      return ++frames <= 3;
    })
    .join("\n");
  return result.length > 1800 ? `${result.slice(0, 1800)}\n[記録上限により省略]` : result;
}

export class RenderingDiagnostics {
  private readonly entries: Entry[];
  private readonly recorded = new WeakSet<Error>();

  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem">,
    build = "development",
  ) {
    const saved = storage.getItem(`${key}:build`) === build ? storage.getItem(key) : null;
    try {
      storage.setItem(`${key}:build`, build);
      if (!saved) storage.setItem(key, "[]");
    } catch {
      // 保存できない場合は現在のページの記録だけを保持する。
    }
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
              this.entries.push({
                time: entry.time,
                source: entry.source,
                detail: compact(entry.detail),
              });
          }
        }
      } catch {
        this.entries.length = 0;
      }
    }
  }

  record(error: unknown, source: string, context = ""): void {
    if (error instanceof Error) {
      if (this.recorded.has(error)) return;
      this.recorded.add(error);
    }
    let failure =
      error instanceof Error
        ? error.stack?.includes(`${error.name}: ${error.message}`)
          ? error.stack
          : `${error.name}: ${error.message}\n${error.stack ?? ""}`
        : String(error);
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
    const text = context ? `${context}\n\n${failure}` : failure;
    const detail = compact(text);
    const last = this.entries.at(-1);
    if (last?.source === source && last.detail === detail) return;
    if (this.entries.length >= 6) this.entries.splice(1, this.entries.length - 5);
    this.entries.push({ time: new Date().toISOString(), source, detail });
    try {
      this.storage.setItem(key, JSON.stringify(this.entries));
    } catch {
      /* 保存できなくても現在のページの記録は保持する。 */
    }
  }

  report(): string {
    const entries =
      this.entries.length > 6 ? [this.entries[0], ...this.entries.slice(-5)] : this.entries;
    return entries
      .filter((entry): entry is Entry => entry !== undefined)
      .map((entry, index) => `[${index + 1}] ${entry.time} ${entry.source}\n${entry.detail}`)
      .join("\n\n");
  }
}
