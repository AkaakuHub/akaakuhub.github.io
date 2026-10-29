import type { BoardNotice } from "../notices";

export interface PrintedPaper {
  width: number;
  height: number;
  pixels: Uint8Array<ArrayBuffer>;
}

export interface PrintRequest {
  id: number;
  notices: readonly BoardNotice[];
  stock: ImageBitmap;
  avatar: ImageBitmap;
  language: ImageBitmap;
}

export type PrintResponse =
  | { id: number; ok: true; papers: PrintedPaper[] }
  | { id: number; ok: false; message: string };
