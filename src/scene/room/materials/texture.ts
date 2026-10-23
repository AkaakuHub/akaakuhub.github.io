import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
} from "three";

type Texel = readonly [number, number, number, number, number];

export function grain(x: number, y: number): number {
  return (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
}

export function mottling(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = grain(ix, iy);
  const b = grain(ix + 1, iy);
  const c = grain(ix, iy + 1);
  const d = grain(ix + 1, iy + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function texture(
  bytes: Uint8Array,
  size: number,
  repeat: readonly [number, number],
  color = false,
): DataTexture {
  const map = new DataTexture(bytes, size, size, RGBAFormat, UnsignedByteType);
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(...repeat);
  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = 8;
  if (color) map.colorSpace = SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}

export function texturedSurface(
  size: number,
  sample: (x: number, y: number) => Texel,
  repeat: readonly [number, number] = [1, 1],
): MeshStandardMaterial {
  const albedo = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(albedo.length);
  const normals = new Uint8Array(albedo.length);
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, elevation, finish] = sample(x / size, y / size);
      const index = (y * size + x) * 4;
      albedo.set([r, g, b, 255], index);
      roughness.set([finish * 255, finish * 255, finish * 255, 255], index);
      heights[y * size + x] = elevation;
    }
  }
  function elevation(x: number, y: number): number {
    const value = heights[((y + size) % size) * size + ((x + size) % size)];
    if (value === undefined) throw new Error("材質の高さを読み取れませんでした。");
    return value;
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (elevation(x - 1, y) - elevation(x + 1, y)) * 4;
      const dy = (elevation(x, y - 1) - elevation(x, y + 1)) * 4;
      const length = Math.hypot(dx, dy, 1);
      normals.set(
        [
          ((dx / length) * 0.5 + 0.5) * 255,
          ((dy / length) * 0.5 + 0.5) * 255,
          (0.5 / length + 0.5) * 255,
          255,
        ],
        (y * size + x) * 4,
      );
    }
  }
  return new MeshStandardMaterial({
    map: texture(albedo, size, repeat, true),
    normalMap: texture(normals, size, repeat),
    normalScale: new Vector2(0.55, 0.55),
    roughnessMap: texture(roughness, size, repeat),
    roughness: 1,
  });
}
