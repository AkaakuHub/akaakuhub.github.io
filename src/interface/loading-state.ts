export function createLoadingState() {
  let status: "loading" | "complete" | "failed" = "loading";
  const stages = { materials: 0, rendering: 0 };
  return {
    get status() {
      return status;
    },
    get value() {
      return status === "complete" ? 1 : stages.materials * 0.75 + stages.rendering * 0.2;
    },
    advance(stage: keyof typeof stages, completed: number, total: number): void {
      if (status !== "loading") return;
      if (
        !Number.isFinite(completed) ||
        !Number.isFinite(total) ||
        total < 1 ||
        completed < 0 ||
        completed > total
      )
        throw new Error("読み込みの進捗が不正です。");
      stages[stage] = Math.max(stages[stage], completed / total);
    },
    complete(): boolean {
      if (status !== "loading") return false;
      status = "complete";
      return true;
    },
    fail(): boolean {
      if (status !== "loading") return false;
      status = "failed";
      return true;
    },
  };
}
