import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

function canvasSurface(size: number): {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("部屋のテクスチャを作成できませんでした。");
  return { canvas, context };
}

function noise(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function floorTexture(): CanvasTexture {
  const { canvas, context } = canvasSurface(1024);
  const random = noise(29);
  context.fillStyle = "#8a795c";
  context.fillRect(0, 0, 1024, 1024);
  const width = 128;
  for (let column = 0; column < 8; column++) {
    const start = column % 2 === 0 ? -256 : -128;
    for (let y = start; y < 1024; y += 256) {
      const shade = Math.floor(random() * 18);
      context.fillStyle = `rgb(${151 + shade},${129 + shade},${95 + shade})`;
      context.fillRect(column * width + 1, y + 1, width - 2, 254);
      for (let grain = 0; grain < 110; grain++) {
        const x = column * width + random() * width;
        context.strokeStyle = `rgba(73,47,22,${random() * 0.1})`;
        context.lineWidth = random() * 1.2 + 0.3;
        context.beginPath();
        context.moveTo(x, y);
        context.bezierCurveTo(x + 5, y + 80, x - 4, y + 180, x + 1, y + 256);
        context.stroke();
      }
      context.strokeStyle = "rgba(255,240,197,0.15)";
      context.strokeRect(column * width + 2, y + 2, width - 4, 252);
    }
  }
  for (let speck = 0; speck < 18000; speck++) {
    context.fillStyle = `rgba(45,32,18,${random() * 0.06})`;
    context.fillRect(random() * 1024, random() * 1024, 1, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texture.anisotropy = 8;
  return texture;
}

export function plasterTexture(): CanvasTexture {
  const { canvas, context } = canvasSurface(256);
  const random = noise(13);
  context.fillStyle = "#e8e5d9";
  context.fillRect(0, 0, 256, 256);
  for (let dot = 0; dot < 15000; dot++) {
    context.fillStyle = `rgba(75,68,53,${random() * 0.06})`;
    context.fillRect(random() * 256, random() * 256, 1, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}
