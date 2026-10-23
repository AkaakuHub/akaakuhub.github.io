import { Group, Mesh, PlaneGeometry } from "three";
import type { Material } from "three";
import { roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

function printedLabel(
  width: number,
  height: number,
  labelIndex: number,
  materials: FurnitureMaterials,
): Mesh {
  const labelGeometry = new PlaneGeometry(width, height);
  const uv = labelGeometry.getAttribute("uv");
  const surfaceUv = uv.clone();
  for (let index = 0; index < uv.count; index++) {
    surfaceUv.setXY(index, uv.getX(index) * width, uv.getY(index) * height);
    uv.setXY(
      index,
      ((labelIndex % 4) + uv.getX(index)) / 4,
      (3 - (Math.floor(labelIndex / 4) % 4) + uv.getY(index)) / 4,
    );
  }
  labelGeometry.setAttribute("uv1", surfaceUv);
  const label = new Mesh(labelGeometry, materials.bookLabels);
  label.receiveShadow = true;
  return label;
}

function pageSurface(mesh: Mesh, axis: "x" | "y"): void {
  const positions = mesh.geometry.getAttribute("position");
  const uv = mesh.geometry.getAttribute("uv");
  mesh.geometry.setAttribute("uv1", uv.clone());
  for (let index = 0; index < uv.count; index++) {
    const across = axis === "x" ? positions.getY(index) : positions.getX(index);
    const depth = axis === "x" ? positions.getX(index) : positions.getY(index);
    uv.setXY(index, across + positions.getZ(index), depth);
  }
}

export function standingBook(
  height: number,
  thickness: number,
  depth: number,
  cover: Material,
  materials: FurnitureMaterials,
  labelIndex: number,
): Group {
  const book = new Group();
  book.name = "bound-book";
  const board = 0.0022;
  for (const side of [-1, 1])
    roundBox(
      book,
      [board, height, depth],
      [(side * (thickness - board)) / 2, height / 2, 0],
      cover,
      0.0008,
    );
  const pages = roundBox(
    book,
    [thickness - board * 2, height - 0.008, depth - 0.01],
    [0, height / 2, 0.002],
    materials.pageEdges,
    0.0007,
  );
  pageSurface(pages, "x");
  roundBox(book, [thickness, height, 0.006], [0, height / 2, -depth / 2 + 0.002], cover, 0.0015);
  const label = printedLabel(thickness * 0.57, 0.057, labelIndex, materials);
  label.rotation.y = Math.PI;
  label.position.set(0, height * 0.7, -depth / 2 - 0.0015);
  book.add(label);
  for (const y of [0.025, height - 0.025])
    roundBox(book, [thickness - 0.003, 0.0015, 0.001], [0, y, -depth / 2 - 0.0016], cover, 0.0003);
  return book;
}

export function closedNotebook(
  width: number,
  thickness: number,
  depth: number,
  cover: Material,
  materials: FurnitureMaterials,
  labelIndex: number,
): Group {
  const book = new Group();
  book.name = "closed-notebook";
  for (const y of [0.001, thickness - 0.001])
    roundBox(book, [width, 0.002, depth], [0, y, 0], cover, 0.0007);
  const pages = roundBox(
    book,
    [width - 0.01, thickness - 0.004, depth - 0.008],
    [0.002, thickness / 2, 0],
    materials.pageEdges,
    0.0007,
  );
  pageSurface(pages, "y");
  roundBox(book, [0.007, thickness, depth], [-width / 2 + 0.003, thickness / 2, 0], cover, 0.0013);
  const label = printedLabel(width * 0.32, depth * 0.45, labelIndex, materials);
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, thickness + 0.0001, 0);
  book.add(label);
  return book;
}
