export interface DecodeRequest {
  id: number;
  blob: Blob;
  options: ImageBitmapOptions;
}

export type DecodeResponse =
  | { id: number; ok: true; bitmap: ImageBitmap }
  | { id: number; ok: false; message: string };
