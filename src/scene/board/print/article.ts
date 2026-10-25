import type { BoardNotice } from "../notices";
import { siteFont } from "../../../assets/typography";
import { thumbnailBounds } from "./image-layout";

export function paintArticle(
  context: CanvasRenderingContext2D,
  print: BoardNotice,
  width: number,
  height: number,
): void {
  const margin = width * 0.06;
  context.fillStyle = print.ink;
  if (print.thumbnail) {
    const image = thumbnailBounds(print.thumbnail.width, print.thumbnail.height, width, height);
    context.drawImage(print.thumbnail, image.x, image.y, image.width, image.height);
    context.font = `500 ${width * 0.02}px ${siteFont}`;
    context.fillText(print.eyebrow, margin, height - 22);
    if (print.link) {
      context.textAlign = "right";
      context.fillText(print.link.label + " ↗", width - margin, height - 22);
      context.textAlign = "left";
    }
  } else {
    context.font = `500 ${width * 0.03}px ${siteFont}`;
    context.fillText(print.title, margin, height / 2, width - margin * 2);
  }
}
