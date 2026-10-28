import {
  CircleGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Path,
  Quaternion,
  Shape,
  Vector3,
} from "three";
import type { BufferGeometry, Material, Object3D } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
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

function indexedGeometry(source: BufferGeometry): BufferGeometry {
  const geometry = mergeVertices(source, 0.0000001);
  source.dispose();
  return geometry;
}

const screw = indexedGeometry(screwGeometry());
const washer = indexedGeometry(washerGeometry());
const bolt = metricCylinderGeometry(0.0058, 0.004, 6);
bolt.rotateX(Math.PI / 2);
bolt.translate(0, 0, 0.0031);

export class HardwareBatch {
  private readonly pieces = new Map<Material, Map<BufferGeometry, Matrix4[]>>();

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
    let pieces = this.pieces.get(material);
    if (!pieces) {
      pieces = new Map();
      this.pieces.set(material, pieces);
    }
    const transforms = pieces.get(geometry);
    if (transforms) transforms.push(transform);
    else pieces.set(geometry, [transform]);
  }

  screw(material: Material, position: Triple, rotation: Triple = [0, 0, 0]): void {
    this.add(screw, material, position, rotation);
  }

  bolt(material: Material, position: Triple, rotation: Triple = [0, 0, 0]): void {
    this.add(washer, material, position, rotation);
    this.add(bolt, material, position, rotation);
  }

  finish(parent: Object3D): void {
    const meshes: Mesh[] = [];
    for (const [material, pieces] of this.pieces) {
      const singles: BufferGeometry[] = [];
      for (const [source, transforms] of pieces) {
        if (transforms.length === 1) {
          const transform = transforms[0];
          if (!transform) throw new Error("金具の配置がありません。");
          singles.push(source.clone().applyMatrix4(transform));
          continue;
        }
        const geometry = source.index ? source : mergeVertices(source, 0.0000001);
        const mesh = new InstancedMesh(geometry, material, transforms.length);
        transforms.forEach((transform, index) => mesh.setMatrixAt(index, transform));
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
        meshes.push(mesh);
      }
      if (singles.length === 0) continue;
      const indexed = singles.map((piece) =>
        piece.index ? piece : mergeVertices(piece, 0.0000001),
      );
      const geometry = mergeGeometries(indexed);
      for (let index = 0; index < indexed.length; index++)
        if (indexed[index] !== singles[index]) indexed[index]?.dispose();
      for (const piece of singles) piece.dispose();
      if (!geometry) throw new Error("金具の形状を結合できませんでした。");
      meshes.push(new Mesh(geometry, material));
    }
    for (const mesh of meshes) {
      mesh.name = "fasteners-and-joinery";
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
    }
    this.pieces.clear();
  }
}
