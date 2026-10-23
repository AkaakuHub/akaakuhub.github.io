import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  TubeGeometry,
  Vector3,
} from "three";
import type { Material } from "three";

function leafPoint(t: number, across: number, length: number, width: number): Vector3 {
  const breadth = Math.sin(Math.PI * t) ** 0.8;
  return new Vector3(
    across * width * breadth + width * 0.15 * Math.sin(Math.PI * t),
    length * t,
    length * 0.15 * t * t + width * 0.23 * breadth * (1 - across * across),
  );
}

function leafGeometry(length: number, width: number): BufferGeometry {
  const rows = 14;
  const columns = 6;
  const layerSize = (rows + 1) * (columns + 1);
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  for (const side of [1, -1])
    for (let row = 0; row <= rows; row++)
      for (let column = 0; column <= columns; column++) {
        const t = row / rows;
        const point = leafPoint(t, (column / columns) * 2 - 1, length, width);
        positions.push(point.x, point.y, point.z + side * 0.00025);
        uvs.push(column / columns, t);
      }
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
      indices.push(a + layerSize, c + layerSize, b + layerSize);
      indices.push(b + layerSize, c + layerSize, d + layerSize);
    }
  for (let row = 0; row < rows; row++)
    for (const column of [0, columns]) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      if (column === 0) indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
      else indices.push(a, a + layerSize, b, b, a + layerSize, b + layerSize);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function botanicalLeaf(material: Material, length: number, width: number): Group {
  const leaf = new Group();
  const blade = new Mesh(leafGeometry(length, width), material);
  blade.name = "curved-leaf-blade";
  blade.castShadow = blade.receiveShadow = true;
  const vein = new CatmullRomCurve3(
    [0, 0.25, 0.5, 0.75, 0.98].map((t) => {
      const point = leafPoint(t, 0, length, width);
      point.z += 0.0004;
      return point;
    }),
  );
  const midrib = new Mesh(new TubeGeometry(vein, 14, 0.00055, 5, false), material);
  midrib.castShadow = true;
  leaf.add(blade, midrib);
  return leaf;
}

export function vaseFoliage(material: Material): Group {
  const plant = new Group();
  plant.name = "vase-cut-stems";
  for (let branch = 0; branch < 3; branch++) {
    const direction = branch - 1;
    const curve = new CatmullRomCurve3([
      new Vector3(direction * 0.006, 0.2, 0),
      new Vector3(direction * 0.018, 0.33, direction * 0.012),
      new Vector3(direction * 0.055, 0.46, direction * 0.02),
      new Vector3(direction * 0.08, 0.57 - branch * 0.018, direction * 0.025),
    ]);
    const stem = new Mesh(new TubeGeometry(curve, 20, 0.0018, 7, false), material);
    stem.castShadow = stem.receiveShadow = true;
    plant.add(stem);
    for (let node = 0; node < 3; node++) {
      const side = (node + branch) % 2 === 0 ? -1 : 1;
      const leaf = botanicalLeaf(material, 0.105 + node * 0.012, 0.022 + node * 0.003);
      leaf.position.copy(curve.getPoint(0.45 + node * 0.24));
      leaf.quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(side * 0.8, 0.5 - node * 0.12, direction * 0.25).normalize(),
      );
      leaf.rotateY(branch * 0.65 + node * 0.4);
      plant.add(leaf);
    }
  }
  return plant;
}
