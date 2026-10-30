import { MathUtils, Vector2 } from "three";
import type { TokyoWeather } from "../../weather/schema";

export const cloudHeight = 6000;
export const cloudElevation = 70;
const width = 128;
const height = 64;

export function cloudOpacity(density: number, cover: number): number {
  const threshold = 1 - cover;
  const shaped = 1 - Math.exp((-Math.max(0, density - threshold) / Math.max(0.1, cover)) * 3.5);
  return MathUtils.lerp(shaped, 1, MathUtils.smoothstep(cover, 0.85, 1));
}

export class CloudField {
  readonly offset = new Vector2();
  private readonly velocity = new Vector2();
  private cover = 0;

  constructor(private readonly data: Uint8Array) {
    if (data.length !== width * height) throw new Error("雲の遮光データのサイズが不正です。");
  }

  get moving(): boolean {
    return this.cover > 0 && this.velocity.lengthSq() > 0;
  }

  update(weather: Pick<TokyoWeather, "windSpeed" | "windDirection">, cover: number): void {
    const bearing = MathUtils.degToRad(weather.windDirection);
    this.velocity.set(Math.cos(bearing), Math.sin(bearing)).multiplyScalar(weather.windSpeed);
    this.cover = cover;
  }

  advance(seconds: number): void {
    this.offset.addScaledVector(this.velocity, seconds);
  }

  transmission(direction: { x: number; y: number; z: number }): number {
    if (this.cover === 0 || direction.y <= 0) return 1;
    const distance = cloudHeight / Math.max(0.02, direction.y);
    const cloudX = direction.x * distance - this.offset.x;
    const cloudZ = direction.z * distance - this.offset.y;
    const elevation = MathUtils.radToDeg(Math.atan2(cloudHeight, Math.hypot(cloudX, cloudZ)));
    const u = Math.atan2(-cloudZ, -cloudX) / (2 * Math.PI) + 0.5;
    const v = MathUtils.clamp(1 - elevation / cloudElevation, 0, 1);
    const x = MathUtils.euclideanModulo(u * width - 0.5, width);
    const y = MathUtils.clamp(v * height - 0.5, 0, height - 1);
    const left = Math.floor(x);
    const top = Math.floor(y);
    const sample = (column: number, row: number): number =>
      this.data[Math.min(row, height - 1) * width + (column % width)]! / 255;
    const density = MathUtils.lerp(
      MathUtils.lerp(sample(left, top), sample(left + 1, top), x - left),
      MathUtils.lerp(sample(left, top + 1), sample(left + 1, top + 1), x - left),
      y - top,
    );
    const opacity = cloudOpacity(density, this.cover);
    const transmission = 1 - opacity * 0.85 * (0.85 + density * 0.15);
    return MathUtils.clamp(transmission / (1 - this.cover * 0.85 * 0.925), 0.45, 1.5);
  }
}
