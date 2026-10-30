interface Setup {
  type: "setup";
  canvas: OffscreenCanvas;
  ink: string;
  size: number;
  ratio: number;
}
type Message = Setup | { type: "progress"; value: number } | { type: "stop" };
let context: OffscreenCanvasRenderingContext2D | null = null;
let target = 0;
let shown = 0;
let previous = 0;
let started = 0;
let size = 48;
let ink = "";
let active = true;
function paint(time: number): void {
  if (!context || !active) return;
  const seconds = Math.min((time - previous) / 1000, 0.1);
  previous = time;
  shown += (target - shown) * (1 - Math.exp(-seconds * 10));
  context.clearRect(0, 0, 280, 80);
  context.fillStyle = ink;
  context.font = `300 ${size}px ui-monospace, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText((shown * 100).toFixed(2), 132, 40);
  context.font = "300 12px ui-monospace, monospace";
  context.fillText("%", 230, 48);
  context.globalAlpha = 0.6;
  context.font = "300 11px ui-monospace, monospace";
  context.fillText(`${((time - started) / 1000).toFixed(2)}s`, 140, 72);
  context.globalAlpha = 1;
  setTimeout(() => paint(performance.now()), 16);
}
self.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === "setup") {
    context = message.canvas.getContext("2d");
    if (!context) throw new Error("進捗を描画できませんでした。");
    context.scale(message.ratio, message.ratio);
    size = message.size;
    ink = message.ink;
    previous = performance.now();
    started = previous;
    setTimeout(() => paint(performance.now()), 16);
  } else if (message.type === "progress") {
    target = message.value;
    if (target === 1) shown = 1;
  } else active = false;
};
