interface Setup {
  type: "setup";
  canvas: OffscreenCanvas;
  ink: string;
  size: number;
  ratio: number;
  accent: string;
  reducedMotion: boolean;
}
type Message = Setup | { type: "progress"; value: number } | { type: "stop" };
let context: OffscreenCanvasRenderingContext2D | null = null;
let target = 0;
let shown = 0;
let previous = 0;
let started = 0;
let size = 48;
let ink = "";
let accent = "";
let reducedMotion = false;
let active = true;

function line(
  time: number,
  start: number,
  end: number,
  x: number,
  y: number,
  angle: number,
  length: number,
  phase: number,
  side: boolean,
  right: boolean,
): void {
  if (!context) return;
  const assembly = Math.max(0, Math.min(1, (shown - start) / (end - start)));
  const remaining = 1 - assembly;
  const drift = reducedMotion ? 0 : -4 * Math.cos(((time / 1000 + phase) * Math.PI * 2) / 3.6);
  context.save();
  context.translate(right ? 280 : 0, side || start === 0.4 ? 280 : 0);
  context.translate(x * 280 * remaining, (y * 280 + drift) * remaining);
  context.rotate((angle * remaining * Math.PI) / 180);
  context.globalAlpha = reducedMotion
    ? 1
    : 0.775 - 0.225 * Math.cos(((time / 1000 + phase) * Math.PI * 2) / 3.6);
  context.fillStyle = phase === 1.8 ? accent : ink;
  const extent = (side ? 280 : 140) * (length + assembly * (1 - length));
  if (side) context.fillRect(0, right ? -280 : -extent, 1, extent);
  else context.fillRect(right ? -extent : 0, 0, extent, 1);
  context.restore();
}

function paint(time: number): void {
  if (!context || !active) return;
  const seconds = Math.min((time - previous) / 1000, 0.1);
  previous = time;
  shown += (target - shown) * (1 - Math.exp(-seconds * 10));
  context.clearRect(-140, -140, 560, 560);
  const elapsed = time - started;
  line(elapsed, 0, 0.4, 0.28, 0.14, -28, 0.3, 0, false, false);
  line(elapsed, 0.4, 0.8, 0.12, -0.28, 55, 0.36, 1.8, false, false);
  line(elapsed, 0.6, 1, 0.1, -0.64, 38, 0.22, 0.9, true, false);
  line(elapsed, 0, 0.4, -0.14, 0.28, 58, 0.34, 1.8, false, true);
  line(elapsed, 0.4, 0.8, -0.34, -0.12, -20, 0.28, 0, false, true);
  line(elapsed, 0.2, 0.6, -0.1, 0.66, 38, 0.2, 0.9, true, true);
  context.fillStyle = ink;
  context.font = `300 ${size}px ui-monospace, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText((shown * 100).toFixed(2), 132, 140);
  context.font = "300 12px ui-monospace, monospace";
  context.fillText("%", 230, 148);
  context.globalAlpha = 0.6;
  context.font = "300 11px ui-monospace, monospace";
  context.fillText(`${(elapsed / 1000).toFixed(2)}s`, 140, 172);
  context.globalAlpha = 1;
  setTimeout(() => paint(performance.now()), 16);
}
self.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === "setup") {
    context = message.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("進捗を描画できませんでした。");
    context.scale(message.ratio, message.ratio);
    context.translate(140, 140);
    size = message.size;
    ink = message.ink;
    accent = message.accent;
    reducedMotion = message.reducedMotion;
    previous = performance.now();
    started = previous;
    paint(previous);
    self.postMessage({ type: "ready" });
  } else if (message.type === "progress") {
    target = message.value;
    if (target === 1) shown = 1;
  } else active = false;
};
