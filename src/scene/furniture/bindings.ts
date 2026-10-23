import { Group } from "three";
import type { Material } from "three";
import { box } from "../primitives";
import { roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

export function standingBook(
  height: number,
  thickness: number,
  depth: number,
  cover: Material,
  materials: FurnitureMaterials,
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
  roundBox(
    book,
    [thickness - board * 2, height - 0.008, depth - 0.01],
    [0, height / 2, 0.002],
    materials.paper,
    0.0007,
  );
  roundBox(book, [thickness, height, 0.006], [0, height / 2, -depth / 2 + 0.002], cover, 0.0015);
  box(
    book,
    [thickness * 0.57, 0.057, 0.0006],
    [0, height * 0.7, -depth / 2 - 0.0013],
    materials.paper,
  );
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
): Group {
  const book = new Group();
  book.name = "closed-notebook";
  for (const y of [0.001, thickness - 0.001])
    roundBox(book, [width, 0.002, depth], [0, y, 0], cover, 0.0007);
  roundBox(
    book,
    [width - 0.01, thickness - 0.004, depth - 0.008],
    [0.002, thickness / 2, 0],
    materials.paper,
    0.0007,
  );
  roundBox(book, [0.007, thickness, depth], [-width / 2 + 0.003, thickness / 2, 0], cover, 0.0013);
  for (let page = 1; page < 4; page++)
    box(
      book,
      [width - 0.014, 0.0003, 0.0005],
      [0.003, 0.002 + ((thickness - 0.004) * page) / 4, depth / 2 - 0.0038],
      materials.ivory,
    );
  return book;
}
