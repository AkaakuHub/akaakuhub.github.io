export const retryLimit = 3;
export const retryWindowMs = 10 * 60_000;

export interface RetryState {
  startedAt: number;
  attempts: number;
}

export function reserveRetry(state: RetryState | null, now: number): RetryState | null {
  if (!state || now - state.startedAt >= retryWindowMs) return { startedAt: now, attempts: 1 };
  if (state.attempts >= retryLimit) return null;
  return { startedAt: state.startedAt, attempts: state.attempts + 1 };
}
