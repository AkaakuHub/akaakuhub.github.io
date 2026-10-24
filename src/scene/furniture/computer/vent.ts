import {
  DataTexture,
  DoubleSide,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
} from "three";

const size = 32;
const pixels = new Uint8Array(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const value = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) < size * 0.39 ? 0 : 255;
    pixels.set([value, value, value, 255], (y * size + x) * 4);
  }
}
const perforations = new DataTexture(pixels, size, size);
perforations.wrapS = perforations.wrapT = RepeatWrapping;
perforations.generateMipmaps = true;
perforations.minFilter = LinearMipmapLinearFilter;
perforations.needsUpdate = true;
const material = new MeshStandardMaterial({
  color: "#dfe3e3",
  roughness: 0.72,
  metalness: 0.25,
  alphaMap: perforations,
  alphaTest: 0.4,
  side: DoubleSide,
});

export function ventPanel(width: number, height: number): Mesh {
  const geometry = new PlaneGeometry(width, height);
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, (uv.getX(index) * width) / 0.004, (uv.getY(index) * height) / 0.004);
  const panel = new Mesh(geometry, material);
  panel.receiveShadow = true;
  return panel;
}
