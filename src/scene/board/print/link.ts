import { ArrowUpRight } from "lucide";

const arrow = ArrowUpRight.map(([tag, attributes]) => {
  if (tag !== "path" || typeof attributes.d !== "string")
    throw new Error("Lucideの右上向き矢印を読み込めませんでした。");
  return new Path2D(attributes.d);
});

export function paintLink(
  context: OffscreenCanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  size: number,
  align: "left" | "right" = "left",
): void {
  const textWidth = context.measureText(label).width;
  const gap = size * 0.25;
  const left = align === "right" ? x - textWidth - gap - size : x;
  context.save();
  context.textAlign = "left";
  context.fillText(label, left, y);
  context.translate(left + textWidth + gap, y - size * 0.82);
  context.scale(size / 24, size / 24);
  context.strokeStyle = context.fillStyle;
  context.lineWidth = 2;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const path of arrow) context.stroke(path);
  context.restore();
}
