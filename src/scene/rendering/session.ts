import { RenderingRecovery } from "./recovery";
import { RenderingDiagnostics } from "./diagnostics";

export const renderingSession = new RenderingRecovery(
  sessionStorage,
  () => location.reload(),
  import.meta.url,
);
export const renderingDiagnostics = new RenderingDiagnostics(sessionStorage, import.meta.url);
