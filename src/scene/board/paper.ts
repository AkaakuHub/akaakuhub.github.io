import type { PbrMaps } from "../materials/library";
import {
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";

import type { PrintedPaper } from "./printing/protocol";

function printedTexture(print: PrintedPaper): DataTexture {
  const texture = new DataTexture(print.pixels, print.width, print.height);
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function paperGeometry(width: number, height: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, height, 12, 16);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index++) {
    const u = positions.getX(index) / width + 0.5;
    const v = positions.getY(index) / height + 0.5;
    const corner = Math.max(0, (u - 0.6) / 0.4) * Math.max(0, (0.4 - v) / 0.4);
    const lift = 0.00025 + 0.002 * (1 - v) ** 2 + 0.012 * corner ** 2;
    positions.setZ(index, lift);
  }
  geometry.computeVertexNormals();
  const surfaceUv = geometry.getAttribute("uv").clone();
  for (let index = 0; index < surfaceUv.count; index++)
    surfaceUv.setXY(index, surfaceUv.getX(index) * width, surfaceUv.getY(index) * height);
  geometry.setAttribute("uv1", surfaceUv);
  return geometry;
}

export function createPaper(
  width: number,
  height: number,
  maps: PbrMaps,
  print: PrintedPaper,
): Mesh<PlaneGeometry, MeshStandardMaterial> {
  const paper = new Mesh(
    paperGeometry(width, height),
    new MeshStandardMaterial({
      map: printedTexture(print),
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      normalScale: new Vector2(0.1, 0.1),
      roughness: 1,
      side: DoubleSide,
    }),
  );
  paper.castShadow = true;
  paper.receiveShadow = true;
  return paper;
}

export function updatePaper(
  paper: Mesh<PlaneGeometry, MeshStandardMaterial>,
  print: PrintedPaper,
): void {
  const previous = paper.material.map;
  paper.material.map = printedTexture(print);
  previous?.dispose();
}
