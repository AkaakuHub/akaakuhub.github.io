import { grain, mottling, texturedSurface } from "./texture";

export function parquet() {
  return texturedSurface(
    512,
    (u, v) => {
      const tileX = Math.floor(u * 4);
      const tileY = Math.floor(v * 4);
      const across = (tileX + tileY) % 2 === 0 ? (u * 4) % 1 : (v * 4) % 1;
      const along = (tileX + tileY) % 2 === 0 ? (v * 4) % 1 : (u * 4) % 1;
      const slat = Math.floor(across * 4);
      const joint = (across * 4) % 1;
      const seam = joint < 0.028 || joint > 0.972 || along < 0.008 || along > 0.992;
      const tone = grain(tileX * 4 + slat, tileY + 42) * 12;
      const fibers = Math.sin(across * 430 + mottling(across * 20, along * 4) * 8) * 2.4;
      const age = mottling(u * 20, v * 20) * 4;
      const polish = Math.max(0, 1 - Math.hypot(u - 0.52, v - 0.5) * 2);
      const shade = seam ? -32 : tone + fibers + age;
      return [
        169 + shade,
        145 + shade,
        105 + shade,
        seam ? 0.1 : 0.55 + fibers * 0.002,
        0.59 - polish * 0.09 + Math.abs(age) * 0.013,
      ];
    },
    [2, 2],
  );
}

export function plaster() {
  return texturedSurface(
    256,
    (u, v) => {
      const cloud = mottling(u * 7, v * 5);
      const pores = grain(Math.floor(u * 256), Math.floor(v * 256));
      const dirt = Math.exp(-v * 18) * (5 + mottling(u * 16, 4) * 4);
      const color = cloud * 3 + pores * 1.2 - dirt;
      return [220 + color, 216 + color, 199 + color, 0.5 + cloud * 0.04 + pores * 0.014, 0.93];
    },
    [2, 1],
  );
}

export function paintedWood(color: readonly [number, number, number]) {
  return texturedSurface(256, (u, v) => {
    const fibers = Math.sin(u * 180 + mottling(u * 10, v * 2) * 4);
    const scuffs = mottling(u * 22, v * 20) * 2;
    return [
      color[0] + fibers * 1.4 + scuffs,
      color[1] + fibers * 1.4 + scuffs,
      color[2] + fibers * 1.2 + scuffs,
      0.5 + fibers * 0.008,
      0.64 + Math.abs(scuffs) * 0.06,
    ];
  });
}

export function acousticTile() {
  return texturedSurface(
    128,
    (u, v) => {
      const pore = grain(Math.floor(u * 128), Math.floor(v * 128));
      const pinhole = (u * 24) % 1 < 0.18 && (v * 24) % 1 < 0.18;
      const shade = pinhole ? -11 : pore * 3;
      return [213 + shade, 214 + shade, 204 + shade, pinhole ? 0.33 : 0.5, 0.96];
    },
    [4, 4],
  );
}

export function wainscot() {
  return texturedSurface(512, (u, v) => {
    const gap = (u * 24) % 1 < 0.018;
    const fibers = Math.sin(u * 1200 + mottling(u * 60, v * 2) * 6);
    const rubbed = Math.exp(-v * 12) * 5;
    const tone = gap ? -16 : fibers * 1.1 + grain(Math.floor(u * 24), 81) * 4 - rubbed;
    return [
      114 + tone,
      101 + tone,
      81 + tone,
      gap ? 0.23 : 0.5 + fibers * 0.006,
      0.7 + rubbed * 0.018,
    ];
  });
}
