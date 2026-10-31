export class MotionResolution {
  private pixels: number;
  private elapsed = 0;
  private frames = 0;

  constructor(maximum: number) {
    this.pixels = maximum;
  }

  get budget(): number {
    return this.pixels;
  }

  sample(seconds: number, moving: boolean): boolean {
    if (!moving) {
      this.elapsed = 0;
      this.frames = 0;
      return false;
    }
    this.elapsed += seconds;
    if (++this.frames < 12) return false;
    const average = this.elapsed / this.frames;
    this.elapsed = 0;
    this.frames = 0;
    if (average <= 1 / 45) return false;
    const next = Math.max(110_000, Math.floor(this.pixels * Math.max(0.5, 1 / 60 / average)));
    if (next >= this.pixels) return false;
    this.pixels = next;
    return true;
  }
}
