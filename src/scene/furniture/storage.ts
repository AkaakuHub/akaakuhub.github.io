import { Group } from "three";
import { box, surface } from "../primitives";
import type { FurnitureMaterials } from "./materials";

function carton(
  parent: Group,
  position: readonly [number, number, number],
  size: readonly [number, number, number],
  materials: FurnitureMaterials,
): void {
  const group = new Group();
  const [width, height, depth] = size;
  box(group, size, [0, height / 2, 0], materials.cardboard);
  box(group, [0.065, 0.002, depth + 0.002], [0, height + 0.002, 0], materials.tape);
  box(group, [0.065, 0.07, 0.002], [0, height - 0.033, -depth / 2 - 0.002], materials.tape);
  box(
    group,
    [width * 0.34, 0.055, 0.002],
    [-width * 0.2, height * 0.48, -depth / 2 - 0.003],
    materials.paper,
  );
  group.position.set(...position);
  parent.add(group);
}

function binders(parent: Group, x: number, y: number, materials: FurnitureMaterials): void {
  const colors = ["#677576", "#625d50", "#a1977d", "#6d7866", "#4f5e64"];
  for (let index = 0; index < 9; index++) {
    const color = colors[index % colors.length];
    if (!color) throw new Error("本の色が見つかりませんでした。");
    const cover = surface(color, 0.84);
    const width = index % 3 === 0 ? 0.065 : 0.045;
    const height = 0.29 + (index % 3) * 0.018;
    const binder = new Group();
    box(binder, [width, height, 0.23], [0, height / 2, 0], cover);
    box(binder, [width * 0.62, height * 0.35, 0.002], [0, height * 0.66, -0.116], materials.paper);
    box(binder, [width * 0.6, 0.008, 0.003], [0, height * 0.27, -0.118], materials.darkSteel);
    binder.position.set(x + index * 0.064, y, 0.015);
    if (index === 8) binder.rotation.z = -0.09;
    parent.add(binder);
  }
}

function createShelf(materials: FurnitureMaterials): Group {
  const shelf = new Group();
  for (const x of [-0.68, 0.68]) {
    for (const z of [-0.22, 0.22]) {
      box(shelf, [0.036, 1.8, 0.036], [x, 0.9, z], materials.shelf);
      box(shelf, [0.055, 0.02, 0.055], [x, 0.015, z], materials.rubber);
    }
  }
  for (const height of [0.13, 0.56, 1.0, 1.45, 1.78]) {
    box(shelf, [1.4, 0.025, 0.48], [0, height, 0], materials.shelf);
    box(shelf, [1.4, 0.045, 0.02], [0, height - 0.025, -0.24], materials.shelf);
  }
  box(shelf, [1.34, 0.022, 0.25], [0, 0.83, 0.2], materials.shelf).rotation.x = 0.35;
  carton(shelf, [-0.34, 0.143, 0], [0.53, 0.29, 0.38], materials);
  carton(shelf, [0.33, 0.143, 0.015], [0.52, 0.29, 0.35], materials);
  carton(shelf, [0.35, 1.463, 0], [0.48, 0.24, 0.38], materials);
  binders(shelf, -0.55, 0.574, materials);
  binders(shelf, -0.6, 1.013, materials);
  const papers = new Group();
  for (let index = 0; index < 5; index++) {
    const stack = box(papers, [0.29, 0.018, 0.34], [0, index * 0.019, 0], materials.paper);
    stack.rotation.y = index % 2 === 0 ? 0.025 : -0.02;
  }
  papers.position.set(0.4, 1.02, 0);
  shelf.add(papers);
  box(shelf, [0.34, 0.12, 0.25], [-0.4, 1.53, 0], materials.black);
  box(shelf, [0.22, 0.06, 0.006], [-0.4, 1.53, -0.129], materials.darkSteel);
  for (const x of [-0.53, -0.27]) {
    box(shelf, [0.055, 0.075, 0.007], [x, 1.53, -0.13], materials.rubber);
  }
  shelf.position.set(-0.8, 0, 2.28);
  return shelf;
}

function createLockers(materials: FurnitureMaterials): Group {
  const lockers = new Group();
  box(lockers, [1.0, 1.82, 0.47], [0, 0.96, 0], materials.cabinet);
  for (const x of [-0.255, 0.255]) {
    box(lockers, [0.47, 1.74, 0.018], [x, 0.98, -0.246], materials.cabinet);
    box(lockers, [0.016, 1.74, 0.008], [x - 0.24, 0.98, -0.261], materials.darkSteel);
    box(lockers, [0.1, 0.033, 0.016], [x, 1.55, -0.266], materials.steel);
    box(lockers, [0.075, 0.018, 0.003], [x, 1.55, -0.276], materials.paper);
    box(lockers, [0.022, 0.11, 0.035], [x + 0.15, 0.98, -0.276], materials.darkSteel);
    for (const height of [0.3, 1.71]) {
      for (let row = 0; row < 4; row++) {
        box(lockers, [0.28, 0.007, 0.003], [x, height + row * 0.022, -0.26], materials.darkSteel);
      }
    }
  }
  for (const x of [-0.41, 0.41]) {
    for (const z of [-0.16, 0.16]) {
      box(lockers, [0.065, 0.07, 0.065], [x, 0.035, z], materials.darkSteel);
    }
  }
  carton(lockers, [-0.2, 1.87, 0], [0.45, 0.28, 0.37], materials);
  lockers.position.set(1.47, 0, 2.26);
  return lockers;
}

export function createStorage(materials: FurnitureMaterials): Group {
  const group = new Group();
  group.add(createShelf(materials), createLockers(materials));
  return group;
}
