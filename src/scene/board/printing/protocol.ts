import type { PaperLink } from "../paper-links";
import type { BoardNotice } from "../notices";

export interface PrintedPaper {
  width: number;
  height: number;
  pixels: Uint8Array<ArrayBuffer>;
  links: readonly PaperLink[];
}

export interface PrintRequest {
  id: number;
  notices: readonly BoardNotice[];
  stock: ImageBitmap;
  avatar: ImageBitmap;
  language: ImageBitmap;
  team: ImageBitmap;
}

export type PrintResponse =
  | { id: number; ok: true; papers: PrintedPaper[] }
  | { id: number; ok: false; message: string };
