import type { BoardNotice } from "../notices";
import type { PrintedPaper } from "./protocol";
import { siteFont } from "../../../assets/typography";
import { paintArticle } from "../print/article";
import { paintProfile } from "../print/profile";
import { paintPortfolio } from "../print/portfolio";
import { paintPrivacy } from "../print/privacy";
import { paintLink } from "../print/link";

export function printPaper(
  print: BoardNotice,
  stock: ImageBitmap,
  avatar: ImageBitmap,
  language: ImageBitmap,
): PrintedPaper {
  const [sheetWidth, sheetHeight] = print.size;
  const canvas = new OffscreenCanvas(1, 1);
  const density = 2048 / Math.max(sheetWidth, sheetHeight);
  canvas.width = Math.round(sheetWidth * density);
  canvas.height = Math.round(sheetHeight * density);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("掲示用紙を描画できませんでした。");
  const width = canvas.width;
  const height = canvas.height;
  const margin = width * 0.06;
  const pattern = context.createPattern(stock, "repeat");
  if (!pattern) throw new Error("紙の繊維を描画できませんでした。");
  pattern.setTransform(
    new DOMMatrix().scale(
      (0.3 * width) / (sheetWidth * stock.width),
      (0.3 * height) / (sheetHeight * stock.height),
    ),
  );
  context.fillStyle = pattern;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "multiply";
  context.fillStyle = print.stock;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  if (print.kind === "privacy") {
    paintPrivacy(context, width);
  } else if (print.kind === "article") {
    paintArticle(context, print, width, height);
  } else {
    if (print.kind === "profile") paintProfile(context, avatar, language, width);
    if (print.kind === "portfolio") paintPortfolio(context, width);
    context.fillStyle = print.ink;
    if (print.link) {
      context.fillRect(margin, height - width * 0.085, width - margin * 2, 1);
      context.font = `500 ${width * 0.042}px ${siteFont}`;
      paintLink(context, print.link.label, margin, height - width * 0.028, width * 0.042);
    }
  }
  const pixels = context.getImageData(0, 0, width, height);
  return { width, height, pixels: new Uint8Array(pixels.data.buffer) };
}
