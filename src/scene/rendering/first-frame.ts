export async function finishFirstFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const measurement = performance.measure("room-first-frame", { start: 0 });
  if (import.meta.env.DEV) console.info(`部室の初回描画: ${measurement.duration.toFixed(0)}ms`);
}
