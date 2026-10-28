import type { Texture } from "three";

interface DisplayFrame {
  source: Texture;
  revision: number;
  exposure: number;
  headroom: number;
  scattering: boolean;
}

export class DisplayState {
  private current: DisplayFrame | undefined;

  update(frame: DisplayFrame, changing: boolean): boolean {
    const previous = this.current;
    const changed =
      changing ||
      previous === undefined ||
      previous.source !== frame.source ||
      previous.revision !== frame.revision ||
      previous.exposure !== frame.exposure ||
      previous.headroom !== frame.headroom ||
      previous.scattering !== frame.scattering;
    this.current = frame;
    return changed;
  }
}
