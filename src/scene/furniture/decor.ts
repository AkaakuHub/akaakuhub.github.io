import { latheGeometry } from "../geometry/curves";
import { Group, Mesh, Vector2 } from "three";
import { box } from "../primitives";
import { standingBook } from "./bindings";
import { vaseFoliage } from "./foliage";
import { roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

function books(parent: Group, x: number, y: number, materials: FurnitureMaterials): void {
  const colors = [
    materials.navy,
    materials.rust,
    materials.mustard,
    materials.bookGreen,
    materials.bookCream,
  ];
  for (let index = 0; index < 7; index++) {
    const color = colors[index % colors.length];
    if (!color) throw new Error("本の材質が見つかりませんでした。");
    const height = 0.24 + (index % 3) * 0.026;
    const thickness = 0.033 + (index % 2) * 0.014;
    const book = standingBook(height, thickness, 0.2, color, materials, index);
    book.position.set(x + index * 0.055, y, -0.014);
    parent.add(book);
  }
}

export function cabinetContents(parent: Group, materials: FurnitureMaterials): void {
  books(parent, -0.37, 0.641, materials);
  books(parent, -0.36, 1.461, materials);
  for (const x of [-0.23, 0.23]) {
    roundBox(parent, [0.33, 0.2, 0.32], [x, 1.141, 0.015], materials.graphite, 0.012);
    box(parent, [0.105, 0.044, 0.002], [x, 1.16, -0.15], materials.paper);
    box(parent, [0.046, 0.006, 0.004], [x, 1.12, -0.154], materials.brass);
  }
  for (let index = 0; index < 4; index++) {
    const paper = roundBox(
      parent,
      [0.24, 0.016, 0.3],
      [0.26, 1.469 + index * 0.016, 0.015],
      materials.paper,
      0.002,
    );
    paper.rotation.y = index * 0.015;
  }
}

function vase(materials: FurnitureMaterials): Group {
  const group = new Group();
  group.name = "hollow-terracotta-vase";
  const profile = [
    [0, 0.005],
    [0.055, 0.005],
    [0.055, 0],
    [0.065, 0],
    [0.073, 0.025],
    [0.078, 0.1],
    [0.065, 0.18],
    [0.035, 0.24],
    [0.037, 0.27],
    [0.036, 0.273],
    [0.031, 0.273],
    [0.03, 0.269],
    [0.029, 0.24],
    [0.059, 0.178],
    [0.072, 0.1],
    [0.066, 0.027],
    [0.057, 0.009],
    [0, 0.009],
  ].map(([x, y]) => new Vector2(x, y));
  const vessel = new Mesh(latheGeometry(profile, 48), materials.terracotta);
  vessel.name = "vase-inner-and-outer-wall";
  vessel.castShadow = vessel.receiveShadow = true;
  group.add(vessel, vaseFoliage(materials.foliage, materials.stem));
  return group;
}

export function tabletopObjects(parent: Group, materials: FurnitureMaterials): void {
  const flowers = vase(materials);
  flowers.position.set(-0.58, 0.971, -0.03);
  parent.add(flowers);
  roundBox(parent, [0.38, 0.07, 0.25], [-0.05, 1.006, 0.02], materials.navy, 0.012);
  box(parent, [0.17, 0.025, 0.001], [-0.05, 1.014, -0.108], materials.paper);
  box(parent, [0.025, 0.025, 0.005], [-0.05, 0.992, -0.113], materials.brass);
}
