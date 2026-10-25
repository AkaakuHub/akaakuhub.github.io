import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { skillDomains, skillLanguages, skillIconNames } from "../../src/content/skills.ts";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("devicon/package.json"));
const columns = 4;
const cell = 128;
const layers = await Promise.all(
  skillIconNames.map(async (icon, index) => ({
    input: await sharp(await readFile(join(root, "icons", icon, `${icon}-original.svg`)))
      .resize(104, 104, { fit: "contain" })
      .png()
      .toBuffer(),
    left: (index % columns) * cell + 12,
    top: Math.floor(index / columns) * cell + 12,
  })),
);
await mkdir("src/assets/skills", { recursive: true });
await sharp({
  create: {
    width: columns * cell,
    height: Math.ceil(skillIconNames.length / columns) * cell,
    channels: 4,
    background: "#00000000",
  },
})
  .composite(layers)
  .webp({ lossless: true })
  .toFile("src/assets/skills/logos.webp");
await mkdir("public/skills", { recursive: true });
await copyFile(join(root, "LICENSE"), "public/skills/devicon-LICENSE.txt");
await writeFile(
  "public/skills/sources.json",
  JSON.stringify(
    {
      collection: "Devicon 2.17.0",
      source: "https://github.com/devicons/devicon",
      examinedAt: "2026-10-25",
      analysis: {
        publicRepositories: 129,
        forksCompared: 38,
        forksWithAheadCommits: 12,
        comparisonUnavailable: ["mkra_4S-C00AS1", "tweetdeck-account-shortcuts-i"],
      },
      domains: skillDomains,
      languages: skillLanguages,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${skillIconNames.length} logos in one ${columns * cell}px atlas`);
