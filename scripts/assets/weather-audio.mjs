import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const root = "https://opengameart.org/sites/default/files/";
const definitions = [
  {
    id: "rain",
    file: "https://bigsoundbank.com/UPLOAD/bwf-en/1019.wav",
    seconds: 32,
    seek: 20,
    bitrate: "192k",
    author: "Joseph SARDIN",
    page: "https://bigsoundbank.com/summer-rain-on-terrace-s1019.html",
  },
  {
    id: "window",
    file: root + "rain_on_window_loop.wav",
    seconds: 10.8,
    bitrate: "192k",
    author: "alxl",
    page: "https://opengameart.org/content/rain-on-window-loop",
  },
  {
    id: "gutter",
    file: root + "rain-gutter-loop_0.mp3",
    seconds: 20,
    bitrate: "192k",
    author: "Ogrebane",
    page: "https://opengameart.org/content/rain-gutter-loop",
  },
  {
    id: "wind",
    file: root + "park_ambience_wind.wav",
    seconds: 24,
    seek: 25,
    bitrate: "192k",
    author: "Thimras",
    page: "https://opengameart.org/content/park-ambiences",
  },
];
await mkdir("src/assets/audio", { recursive: true });
function ffmpeg(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    const parts = [];
    child.stdout.on("data", (part) => parts.push(part));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(Buffer.concat(parts)) : reject(new Error(`ffmpeg: ${code}`)),
    );
    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE" && error.code !== "EOF") reject(error);
    });
    child.stdin.end(input);
  });
}
for (const source of definitions) {
  if (process.argv[2] && source.id !== process.argv[2]) continue;
  let input;
  if (!source.seek) {
    const response = await fetch(source.file);
    if (!response.ok) throw new Error(`Audio: HTTP ${response.status}`);
    input = new Uint8Array(await response.arrayBuffer());
  }
  const args = [];
  if (source.seek) args.push("-ss", String(source.seek));
  args.push(
    "-i",
    source.seek ? source.file : "pipe:0",
    "-t",
    String(source.seconds),
    "-af",
    "highpass=f=60,loudnorm=I=-20:TP=-3:LRA=11",
    "-ac",
    "1",
    "-ar",
    "48000",
    "-f",
    "f32le",
    "pipe:1",
  );
  const pcm = new Float32Array(Uint8Array.from(await ffmpeg(args, input)).buffer);
  if (pcm.length < 48000) throw new Error(`Audio is empty: ${source.id}`);
  const overlap = 14400;
  const loop = pcm.slice(overlap);
  for (let index = 0; index < overlap; index++) {
    const angle = (((index + 0.5) / overlap) * Math.PI) / 2;
    loop[loop.length - overlap + index] =
      pcm[pcm.length - overlap + index] * Math.cos(angle) + pcm[index] * Math.sin(angle);
  }
  let peak = 0;
  for (const sample of loop) peak = Math.max(peak, Math.abs(sample));
  const scale = Math.min(1, 0.85 / peak);
  for (let index = 0; index < loop.length; index++) loop[index] *= scale;
  const bytes = await ffmpeg(
    [
      "-f",
      "f32le",
      "-ar",
      "48000",
      "-ac",
      "1",
      "-i",
      "pipe:0",
      "-c:a",
      "libopus",
      "-b:a",
      source.bitrate,
      "-application",
      "audio",
      "-f",
      "opus",
      "pipe:1",
    ],
    new Uint8Array(loop.buffer),
  );
  if (bytes.length < 1000) throw new Error(`Audio encoding failed: ${source.id}`);
  await writeFile(`src/assets/audio/${source.id}.opus`, bytes);
  console.log(`${source.id}: encoded`);
}
await mkdir("public/audio", { recursive: true });
await writeFile(
  "public/audio/sources.json",
  JSON.stringify(
    definitions.map((source) => ({
      id: source.id,
      author: source.author,
      source: source.page,
      download: source.file,
      license: "CC0-1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      processing: "Mono 48kHz Opus, circular crossfade and loudness normalisation",
      ...(source.seek ? { startSeconds: source.seek } : {}),
      sourceDurationSeconds: source.seconds,
    })),
    null,
    2,
  ) + "\n",
);
await import("./catalog.mjs");
