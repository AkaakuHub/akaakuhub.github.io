import { grain, mottling, smoothstep, texturedSurface } from "./texture";

export function parquet() {
  const blockSize = 5.4 / 16;
  const slatWidth = blockSize / 4;
  return texturedSurface(
    1024,
    (u, v) => {
      const tileX = Math.floor(u * 4);
      const tileY = Math.floor(v * 4);
      const across = (tileX + tileY) % 2 === 0 ? (u * 4) % 1 : (v * 4) % 1;
      const along = (tileX + tileY) % 2 === 0 ? (v * 4) % 1 : (u * 4) % 1;
      const slat = Math.floor(across * 4);
      const joint = (across * 4) % 1;
      const edgeDistance = Math.min(
        joint * slatWidth,
        (1 - joint) * slatWidth,
        along * blockSize,
        (1 - along) * blockSize,
      );
      const seam = 1 - smoothstep(0.00025, 0.0012, edgeDistance);
      const seed = grain(tileX * 4 + slat, tileY + 42);
      const fineGrain = Math.sin(across * 480 + mottling(across * 19 + seed, along * 3) * 3) * 0.65;
      const fibers = fineGrain + mottling(across * 90 + seed * 4, along * 4) * 1.4;
      const color = seed * 7 + fibers - seam * 14 + mottling(u * 15, v * 15) * 1.2;
      const wear = mottling(u * 3 + 14, v * 3 + 42) * 0.025;
      return [
        166 + color,
        142 + color,
        106 + color,
        0.5 + fibers * 0.0008 - seam * 0.014,
        0.47 + seed * 0.025 + wear + seam * 0.16,
      ];
    },
    [4, 4],
  );
}

export function plaster() {
  return texturedSurface(
    256,
    (u, v) => {
      const cloud = mottling(u * 7, v * 5);
      const pores = grain(Math.floor(u * 256), Math.floor(v * 256));
      const dirt = Math.exp(-v * 18) * (2.2 + mottling(u * 16, 4));
      const color = cloud * 1.4 + pores * 0.3 - dirt;
      return [
        220 + color,
        216 + color,
        199 + color,
        0.5 + pores * 0.0008,
        0.9 + pores * 0.012 + cloud * 0.012,
      ];
    },
    [2, 1],
  );
}

export function paintedWood(color: readonly [number, number, number]) {
  return texturedSurface(256, (u, v) => {
    const fibers = Math.sin(u * 180 + mottling(u * 10, v * 2) * 4);
    const scuffs = mottling(u * 22, v * 20) * 1.2;
    return [
      color[0] + fibers * 1.1 + scuffs,
      color[1] + fibers * 1.1 + scuffs,
      color[2] + fibers + scuffs,
      0.5 + fibers * 0.0018,
      0.66 + Math.abs(scuffs) * 0.025,
    ];
  });
}

export function acousticTile() {
  return texturedSurface(
    256,
    (u, v) => {
      const pore = grain(Math.floor(u * 256), Math.floor(v * 256));
      const distance = Math.hypot(((u * 32) % 1) - 0.5, ((v * 32) % 1) - 0.5);
      const pinhole = 1 - smoothstep(0.045, 0.13, distance);
      const shade = pore * 0.8 - pinhole * 5;
      return [213 + shade, 214 + shade, 204 + shade, 0.5 - pinhole * 0.008 + pore * 0.0005, 0.95];
    },
    [8, 8],
  );
}

export function wainscot() {
  return texturedSurface(
    512,
    (u, v) => {
      const phase = (u * 6) % 1;
      const edgeDistance = Math.min(phase, 1 - phase) * (5.4 / 24);
      const groove = 1 - smoothstep(0.0002, 0.0024, edgeDistance);
      const fibers =
        mottling(u * 140, v * 3) * 0.8 + Math.sin(u * 600 + mottling(u * 20, v * 3) * 3) * 0.3;
      const rubbed = Math.exp(-v * 12) * 2;
      const tone = fibers + grain(Math.floor(u * 6), 81) * 3 - rubbed - groove * 10;
      return [
        114 + tone,
        101 + tone,
        81 + tone,
        0.5 + fibers * 0.0015 - groove * 0.008,
        0.7 + rubbed * 0.008 + fibers * 0.015,
      ];
    },
    [4, 1],
  );
}
