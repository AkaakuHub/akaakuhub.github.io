import { mkdir, writeFile } from "node:fs/promises";
import { FloatType } from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import sharp from "sharp";

const sources = [
  "kloofendal_48d_partly_cloudy_puresky",
  "kloofendal_overcast_puresky",
  "qwantani_sunset_puresky",
];
const width = 4096;
const layerHeight = 512;

async function photograph(id) {
  const response = await fetch(`https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/${id}_4k.hdr`);
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  return new HDRLoader().setDataType(FloatType).parse(await response.arrayBuffer());
}

function encode(image, top, rows) {
  const values = [];
  for (let index = 0; index < image.width * rows; index += 16) {
    const offset = (top * image.width + index) * 4;
    values.push(
      image.data[offset] * 0.2126 +
        image.data[offset + 1] * 0.7152 +
        image.data[offset + 2] * 0.0722,
    );
  }
  values.sort((a, b) => a - b);
  const exposure = values[Math.floor(values.length * 0.9)];
  const pixels = new Uint8Array(image.width * rows * 3);
  for (let index = 0; index < image.width * rows; index++) {
    const offset = (top * image.width + index) * 4;
    const highlight =
      Math.max(image.data[offset], image.data[offset + 1], image.data[offset + 2]) > exposure * 8;
    for (let channel = 0; channel < 3; channel++) {
      let value = image.data[offset + channel];
      if (highlight) {
        const row = Math.floor(index / image.width) + top;
        const x = index % image.width;
        value =
          (image.data[(row * image.width + ((x + 64) % image.width)) * 4 + channel] +
            image.data[
              (row * image.width + ((x - 64 + image.width) % image.width)) * 4 + channel
            ]) /
          2;
      }
      const mapped = 1 - Math.exp(-value / exposure);
      pixels[index * 3 + channel] = Math.round(
        (mapped <= 0.0031308 ? mapped * 12.92 : 1.055 * mapped ** (1 / 2.4) - 0.055) * 255,
      );
    }
  }
  return pixels;
}

await mkdir("src/assets/environment", { recursive: true });
const layers = [];
for (const id of sources) {
  const image = await photograph(id);
  const top = Math.round(image.height * (0.5 - 70 / 180));
  const rows = Math.floor(image.height / 2) - top;
  const pixels = encode(image, top, rows);
  const input = await sharp(pixels, { raw: { width: image.width, height: rows, channels: 3 } })
    .resize(width, layerHeight)
    .png()
    .toBuffer();
  layers.push({ input, left: 0, top: layers.length * layerHeight });
  if (id === sources[0]) {
    const density = new Uint8Array(image.width * rows);
    for (let index = 0; index < density.length; index++) {
      const offset = (top * image.width + index) * 4;
      const ratio = image.data[offset] / Math.max(0.0001, image.data[offset + 2]);
      density[index] = Math.round(Math.max(0, Math.min(1, (ratio - 0.35) / 0.65)) * 255);
    }
    const field = await sharp(density, { raw: { width: image.width, height: rows, channels: 1 } })
      .resize(128, 64)
      .greyscale()
      .raw()
      .toBuffer();
    await writeFile("src/assets/environment/clouds.bin", field);
  }
}
const atlas = await sharp({
  create: { width, height: layerHeight * layers.length, channels: 3, background: "black" },
})
  .composite(layers)
  .webp({ quality: 91, effort: 6 })
  .toBuffer();
await writeFile("src/assets/environment/clouds.webp", atlas);

const landscape = await photograph("kloofendal_48d_partly_cloudy");
const top = Math.round(landscape.height * 0.46);
const rows = Math.round(landscape.height * 0.34);
const rgb = encode(landscape, top, rows);
const rgba = new Uint8Array(landscape.width * rows * 4);
const start = Math.round(landscape.height * 0.48) - top;
const end = Math.round(landscape.height * 0.52) - top;
const levels = end - start;
const paths = new Uint16Array(landscape.width * levels);
let costs = new Float32Array(levels);
for (let x = 0; x < landscape.width; x++) {
  const next = new Float32Array(levels);
  for (let level = 0; level < levels; level++) {
    const y = start + level;
    let contrast = 0;
    for (let step = 1; step <= 3; step++) {
      const above = ((y - step) * landscape.width + x) * 3;
      const below = ((y + step) * landscape.width + x) * 3;
      contrast +=
        (rgb[above] - rgb[below]) * 0.2126 +
        (rgb[above + 1] - rgb[below + 1]) * 0.7152 +
        (rgb[above + 2] - rgb[below + 2]) * 0.0722;
    }
    let best = Infinity;
    for (
      let previous = Math.max(0, level - 3);
      previous <= Math.min(levels - 1, level + 3);
      previous++
    ) {
      const cost = costs[previous] + (previous - level) ** 2 * 12;
      if (cost < best) {
        best = cost;
        paths[x * levels + level] = previous;
      }
    }
    next[level] = best - contrast;
  }
  costs = next;
}
const boundaries = new Uint16Array(landscape.width);
let level = costs.indexOf(Math.min(...costs));
for (let x = landscape.width - 1; x >= 0; x--) {
  boundaries[x] = start + level;
  level = paths[x * levels + level];
}
for (let x = 0; x < landscape.width; x++) {
  const neighbors = Array.from(
    { length: 9 },
    (_, index) => boundaries[(x + index - 4 + landscape.width) % landscape.width],
  ).sort((a, b) => a - b);
  const boundary = neighbors[4];
  for (let y = 0; y < rows; y++) {
    const index = y * landscape.width + x;
    const alpha = Math.round(Math.max(0, Math.min(1, y - boundary)) * 255);
    rgba.set([rgb[index * 3], rgb[index * 3 + 1], rgb[index * 3 + 2], alpha], index * 4);
  }
}
const horizon = await sharp(rgba, { raw: { width: landscape.width, height: rows, channels: 4 } })
  .resize(2048)
  .webp({ quality: 82, alphaQuality: 100, effort: 6 })
  .toBuffer();
await writeFile("src/assets/environment/horizon.webp", horizon);
console.log(`Sky: ${atlas.length} bytes, horizon: ${horizon.length} bytes`);
