import type { Texture } from "three";

interface DisplayFrame {
  source: Texture;
  revision: number;
  exposure: number;
  headroom: number;
}

export class DisplayState {
  private current: DisplayFrame | undefined;

  invalidate(): void {
    this.current = undefined;
  }

  update(frame: DisplayFrame, changing: boolean): boolean {
    const previous = this.current;
    const changed =
      changing ||
      previous === undefined ||
      previous.source !== frame.source ||
      previous.revision !== frame.revision ||
      previous.exposure !== frame.exposure ||
      previous.headroom !== frame.headroom;
    this.current = frame;
    return changed;
  }
}
