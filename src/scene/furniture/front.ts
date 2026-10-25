import { tubeGeometry } from "../geometry/curves";
import { CatmullRomCurve3, Group, Mesh, Vector3 } from "three";
import { closedNotebook, standingBook } from "./bindings";
import { ceramicMug } from "./ceramic";
import { cylinder, rod } from "./geometry";
import type { FurnitureMaterials } from "./materials";
import { cartFrame } from "./cart-frame";

function readingCart(materials: FurnitureMaterials): Group {
  const cart = new Group();
  cartFrame(cart, materials);
  const covers = [materials.navy, materials.rust, materials.mustard, materials.bookCream];
  for (let index = 0; index < 7; index++) {
    const cover = covers[index % covers.length];
    if (!cover) throw new Error("本の材質が見つかりません。");
    const height = 0.25 + (index % 3) * 0.017;
    const book = standingBook(height, 0.047, 0.22, cover, materials, index + 7);
    book.rotation.y = Math.PI;
    book.position.set(-0.2 + index * 0.058, 0.1925, 0.035);
    if (index === 6) book.rotation.z = -0.1;
    if (index === 6) book.position.y += 0.0235 * Math.sin(0.1);
    cart.add(book);
  }
  for (let index = 0; index < 3; index++) {
    const stack = closedNotebook(0.36, 0.043, 0.25, covers[index]!, materials, index + 4);
    stack.position.set(-0.05, 0.5825 + index * 0.043, 0.015);
    stack.rotation.y = (index - 1) * 0.04;
    cart.add(stack);
  }
  const cup = ceramicMug(materials.porcelain, 0.075, 0.043);
  cup.position.set(-0.12, 0.9205, 0.02);
  cart.add(cup);
  cylinder(cart, 0.062, 0.008, [-0.12, 0.9165, 0.02], materials.porcelain);
  const notebook = closedNotebook(0.2, 0.025, 0.27, materials.rust, materials, 9);
  notebook.position.set(0.14, 0.9125, 0.015);
  notebook.rotation.y = -0.1;
  cart.add(notebook);
  cart.position.set(-2.02, 0, -2.12);
  return cart;
}

function coatStand(materials: FurnitureMaterials): Group {
  const stand = new Group();
  cylinder(stand, 0.22, 0.025, [0, 0.0125, 0], materials.graphite, 0.18);
  cylinder(stand, 0.05, 0.055, [0, 0.0525, 0], materials.graphite, 0.027);
  rod(stand, [0, 0.05, 0], [0, 1.82, 0], 0.018, materials.deepGreen);
  for (let index = 0; index < 3; index++) {
    const angle = (index * Math.PI * 2) / 3;
    const point = (radius: number, height: number) =>
      new Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    const curve = new CatmullRomCurve3([
      point(0, 1.65),
      point(0.045, 1.76),
      point(0.15, 1.88),
      point(0.2, 1.87),
      point(0.205, 1.82),
    ]);
    const hook = new Mesh(tubeGeometry(curve, 20, 0.009, 8, false), materials.deepGreen);
    hook.castShadow = hook.receiveShadow = true;
    stand.add(hook);
    cylinder(
      stand,
      0.013,
      0.036,
      [Math.cos(angle) * 0.205, 1.81, Math.sin(angle) * 0.205],
      materials.oak,
    );
  }
  stand.position.set(2.08, 0, -1.98);
  return stand;
}

export function createFrontFurniture(materials: FurnitureMaterials): Group {
  const group = new Group();
  group.add(readingCart(materials), coatStand(materials));
  return group;
}
