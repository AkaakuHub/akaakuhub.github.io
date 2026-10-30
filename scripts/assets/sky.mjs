import { mkdir, writeFile } from "node:fs/promises";
import { FloatType } from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import sharp from "sharp";

const skies = [
  "kloofendal_43d_clear_puresky",
  "kloofendal_48d_partly_cloudy_puresky",
  "kloofendal_overcast_puresky",
  "belfast_sunset_puresky",
];
const layers = [];
for (const id of skies) {
  const url = `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${id}_1k.hdr`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const { width, height, data } = new HDRLoader()
    .setDataType(FloatType)
    .parse(await response.arrayBuffer());
  const rows = height / 2;
  const luminance = [];
  for (let index = 0; index < width * rows; index += 4) {
    const offset = index * 4;
    luminance.push(data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722);
  }
  luminance.sort((a, b) => a - b);
  const exposure = luminance[Math.floor(luminance.length * 0.9)];
  const pixels = new Uint8Array(width * rows * 3);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const bright = Math.max(data[offset], data[offset + 1], data[offset + 2]) > exposure * 12;
      for (let channel = 0; channel < 3; channel++) {
        let value = data[offset + channel];
        if (bright) {
          const left = (y * width + ((x - 8 + width) % width)) * 4 + channel;
          const right = (y * width + ((x + 8) % width)) * 4 + channel;
          value = (data[left] + data[right]) / 2;
        }
        const mapped = 1 - Math.exp(-value / exposure);
        const encoded = mapped <= 0.0031308 ? mapped * 12.92 : 1.055 * mapped ** (1 / 2.4) - 0.055;
        pixels[(y * width + x) * 3 + channel] = Math.round(encoded * 255);
      }
    }
  }
  const input = await sharp(pixels, { raw: { width, height: rows, channels: 3 } })
    .png()
    .toBuffer();
  layers.push({ input, top: layers.length * 256, left: 0 });
}
await mkdir("src/assets/environment", { recursive: true });
const atlas = await sharp({
  create: { width: 1024, height: 1024, channels: 3, background: "black" },
})
  .composite(layers)
  .webp({ quality: 86, effort: 6 })
  .toBuffer();
await writeFile("src/assets/environment/sky.webp", atlas);
console.log(`Sky atlas: ${atlas.length} bytes`);
