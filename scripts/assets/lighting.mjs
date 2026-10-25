import { mkdir, readFile, writeFile } from "node:fs/promises";
import { RectAreaLightTexturesLib } from "three/addons/lights/RectAreaLightTexturesLib.js";

RectAreaLightTexturesLib.init();
const tables = [RectAreaLightTexturesLib.LTC_HALF_1, RectAreaLightTexturesLib.LTC_HALF_2];
const bytes = Buffer.concat(tables.map((texture) => Buffer.from(texture.image.data.buffer)));
await mkdir("src/assets/lighting", { recursive: true });
await writeFile("src/assets/lighting/ltc.bin", bytes);
await mkdir("public/lighting", { recursive: true });
const license = await readFile(new URL("../LICENSE", import.meta.resolve("three")), "utf8");
await writeFile(
  "public/lighting/LICENSE.txt",
  `LTC tables from Three.js RectAreaLightTexturesLib\nhttps://github.com/mrdoob/three.js\nhttps://github.com/selfshadow/ltc_code\n\n${license}`,
);
