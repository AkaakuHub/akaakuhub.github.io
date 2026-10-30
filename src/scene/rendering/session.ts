import { RenderingRecovery } from "./recovery";
import { RenderingDiagnostics } from "./diagnostics";

export const renderingSession = new RenderingRecovery(sessionStorage, () => location.reload());
export const renderingDiagnostics = new RenderingDiagnostics(sessionStorage);
