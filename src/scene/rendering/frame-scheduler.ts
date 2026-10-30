interface FrameClock {
  now(): number;
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}

const browserClock: FrameClock = {
  now: () => performance.now(),
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

export class FrameScheduler {
  private frame = 0;
  private previous = 0;
  private lastRendered = 0;
  private submitted = 0;
  private waiting = false;
  private running = false;
  private active = true;

  constructor(
    private readonly render: (time: number, seconds: number) => boolean,
    private readonly completed: () => Promise<void>,
    private readonly failed: (error: Error) => void,
    private readonly clock: FrameClock = browserClock,
  ) {}

  request(): void {
    if (!this.active || this.frame || this.waiting) return;
    if (!this.running) this.previous = this.clock.now() - 1000 / 60;
    this.running = true;
    this.frame = this.clock.request(this.tick);
  }

  setActive(active: boolean): void {
    this.active = active;
    if (active) return;
    this.clock.cancel(this.frame);
    this.frame = 0;
    this.waiting = false;
    this.running = false;
  }

  private readonly tick = (time: number): void => {
    this.frame = 0;
    if (!this.active) return;
    if (this.submitted >= 2) {
      this.waiting = true;
      return;
    }
    if (time - this.lastRendered < 1000 / 60 - 0.5) {
      this.request();
      return;
    }
    try {
      const animate = this.render(time, (time - this.previous) / 1000);
      this.previous = time;
      this.lastRendered = time;
      this.submitted++;
      void this.completed().then(() => {
        this.submitted--;
        if (!this.waiting || !this.active) return;
        this.waiting = false;
        this.request();
      }, this.fail);
      if (animate) this.request();
      else this.running = false;
    } catch (error) {
      this.fail(error);
    }
  };

  private readonly fail = (error: unknown): void => {
    this.setActive(false);
    this.failed(error instanceof Error ? error : new Error(String(error)));
  };
}
