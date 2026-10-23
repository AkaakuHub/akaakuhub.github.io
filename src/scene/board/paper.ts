import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

interface PaperPrint {
  title: string;
  lines: readonly string[];
  ink: string;
  stock: string;
}

function printedPaper(print: PaperPrint, landscape: boolean): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = landscape ? 960 : 640;
  canvas.height = landscape ? 640 : 880;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("掲示用紙を描画できませんでした。");
  const { width, height } = canvas;
  context.fillStyle = print.stock;
  context.fillRect(0, 0, width, height);
  let randomState = 71357;
  const random = () => {
    randomState = (randomState * 48271) % 2147483647;
    return randomState / 2147483647;
  };
  for (let fiber = 0; fiber < 14000; fiber++) {
    const shade = random() > 0.5 ? "88,73,48" : "255,255,245";
    context.strokeStyle = `rgba(${shade},${random() * 0.055})`;
    const x = random() * width;
    const y = random() * height;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + random() * 3, y + random() * 0.8);
    context.stroke();
  }
  const margin = 60;
  const headingY = landscape ? 195 : 245;
  context.fillStyle = print.ink;
  context.fillRect(margin, 78, 17, 17);
  context.font = landscape ? "600 61px sans-serif" : "600 58px sans-serif";
  context.fillText(print.title, margin, headingY);
  context.strokeStyle = print.ink;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(margin, headingY + 42);
  context.lineTo(width - margin, headingY + 42);
  context.stroke();
  context.font = landscape ? "35px sans-serif" : "32px sans-serif";
  context.fillStyle = "#444e47";
  const firstLine = headingY + (landscape ? 128 : 168);
  const secondLine = height - 104;
  for (const [index, line] of print.lines.entries()) {
    context.font =
      index === 0 ? `${landscape ? 35 : 32}px sans-serif` : `${landscape ? 29 : 25}px monospace`;
    context.fillText(line, margin, index === 0 ? firstLine : secondLine);
  }
  const fold = context.createLinearGradient(width - 45, height - 80, width, height);
  fold.addColorStop(0, "rgba(102,91,66,0)");
  fold.addColorStop(1, "rgba(102,91,66,0.06)");
  context.fillStyle = fold;
  context.fillRect(width - 60, height - 90, 60, 90);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createPaper(width: number, height: number, print: PaperPrint): Mesh {
  const geometry = new PlaneGeometry(width, height, 20, 24);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index++) {
    const u = positions.getX(index) / width + 0.5;
    const v = positions.getY(index) / height + 0.5;
    const corner = Math.max(0, (u - 0.6) / 0.4) * Math.max(0, (0.4 - v) / 0.4);
    const lift = 0.0015 + 0.008 * (1 - v) ** 2 + 0.026 * corner ** 2;
    positions.setZ(index, lift);
  }
  geometry.computeVertexNormals();
  const paper = new Mesh(
    geometry,
    new MeshStandardMaterial({
      map: printedPaper(print, width > height),
      roughness: 0.96,
      side: DoubleSide,
    }),
  );
  paper.castShadow = true;
  paper.receiveShadow = true;
  return paper;
}
