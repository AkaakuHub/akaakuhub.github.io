export function createScreenScroll() {
  let position = 0;
  let target = 0;
  let maximum = 0;
  const clamp = (value: number) => Math.max(0, Math.min(maximum, value));
  return {
    get position() {
      return position;
    },
    setMaximum(value: number) {
      maximum = Math.max(0, value);
      position = clamp(position);
      target = clamp(target);
    },
    reset() {
      position = 0;
      target = 0;
    },
    move(delta: number, immediate: boolean) {
      target = clamp((immediate ? position : target) + delta);
      if (immediate) position = target;
    },
    update(seconds: number) {
      const previous = position;
      position += (target - position) * (1 - Math.exp(-18 * Math.max(0, seconds)));
      if (Math.abs(target - position) < 0.1) position = target;
      return { changed: position !== previous, active: position !== target };
    },
  };
}
