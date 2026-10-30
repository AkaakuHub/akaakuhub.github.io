import { RenderingRecovery } from "./recovery";

export const renderingSession = new RenderingRecovery(sessionStorage, () => location.reload());
