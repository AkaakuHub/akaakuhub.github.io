import {
  CircleGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Matrix4,
  Mesh,
  Path,
  Quaternion,
  Shape,
  Vector3,
} from "three";
import type { BufferGeometry, Material, Object3D } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { metricCylinderUv } from "../materials/uv";

type Triple = readonly [number, number, number];

function screwGeometry(): BufferGeometry {
  const outline = new Shape();
  outline.absarc(0, 0, 0.0038, 0, Math.PI * 2, false);
  const recess = new Path();
  const arm = 0.0018;
  const neck = 0.00043;
  recess.moveTo(-neck, -arm);
  recess.lineTo(neck, -arm);
  recess.lineTo(neck, -neck);
  recess.lineTo(arm, -neck);
  recess.lineTo(arm, neck);
  recess.lineTo(neck, neck);
  recess.lineTo(neck, arm);
  recess.lineTo(-neck, arm);
  recess.lineTo(-neck, neck);
  recess.lineTo(-arm, neck);
  recess.lineTo(-arm, -neck);
  recess.lineTo(-neck, -neck);
  recess.closePath();
  outline.holes.push(recess);
  const rim = new ExtrudeGeometry(outline, {
    depth: 0.0018,
    bevelEnabled: true,
    bevelThickness: 0.0003,
    bevelSize: 0.0003,
    bevelSegments: 2,
    curveSegments: 20,
    steps: 1,
  });
  rim.translate(0, 0, 0.0006);
  const bottom = new CircleGeometry(0.0038, 24).toNonIndexed();
  const positions = bottom.getAttribute("position");
  const uv = bottom.getAttribute("uv");
  for (let index = 0; index < positions.count; index++)
    uv.setXY(index, positions.getX(index), positions.getY(index));
  bottom.translate(0, 0, 0.00015);
  const geometry = mergeGeometries([rim, bottom]);
  rim.dispose();
  bottom.dispose();
  if (!geometry) throw new Error("ビスの形状を結合できませんでした。");
  return geometry;
}

function washerGeometry(): BufferGeometry {
  const ring = new Shape();
  ring.absarc(0, 0, 0.0065, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, 0.0032, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  return new ExtrudeGeometry(ring, {
    depth: 0.0009,
    bevelEnabled: true,
    bevelThickness: 0.00015,
    bevelSize: 0.00015,
    bevelSegments: 1,
    curveSegments: 20,
    steps: 1,
  });
}

export function metricCylinderGeometry(
  radius: number,
  height: number,
  segments = 24,
): CylinderGeometry {
  const geometry = new CylinderGeometry(radius, radius, height, segments);
  metricCylinderUv(geometry);
  return geometry;
}

const screw = screwGeometry();
const washer = washerGeometry();
const bolt = metricCylinderGeometry(0.0058, 0.004, 6);
bolt.rotateX(Math.PI / 2);
bolt.translate(0, 0, 0.0031);

export class HardwareBatch {
  private readonly pieces = new Map<Material, BufferGeometry[]>();

  add(
    geometry: BufferGeometry,
    material: Material,
    position: Triple,
    rotation: Triple = [0, 0, 0],
  ): void {
    const transform = new Matrix4().compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)),
      new Vector3(1, 1, 1),
    );
    const copy = geometry.clone().applyMatrix4(transform);
    const pieces = this.pieces.get(material);
    if (pieces) pieces.push(copy);
    else this.pieces.set(material, [copy]);
  }

  screw(material: Material, position: Triple, rotation: Triple = [0, 0, 0]): void {
    this.add(screw, material, position, rotation);
  }

  bolt(material: Material, position: Triple, rotation: Triple = [0, 0, 0]): void {
    this.add(washer, material, position, rotation);
    this.add(bolt, material, position, rotation);
  }

  finish(parent: Object3D): void {
    for (const [material, pieces] of this.pieces) {
      const geometry = mergeGeometries(
        pieces.map((piece) => (piece.index ? piece.toNonIndexed() : piece)),
      );
      for (const piece of pieces) piece.dispose();
      if (!geometry) throw new Error("金具の形状を結合できませんでした。");
      const mesh = new Mesh(geometry, material);
      mesh.name = "fasteners-and-joinery";
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
    }
    this.pieces.clear();
  }
}
