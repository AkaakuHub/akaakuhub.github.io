import {
  CatmullRomCurve3,
  Group,
  LatheGeometry,
  Mesh,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { box } from "../primitives";
import { cylinder, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

function readingCart(materials: FurnitureMaterials): Group {
  const cart = new Group();
  for (const x of [-0.285, 0.285]) {
    for (const z of [-0.17, 0.17]) {
      rod(cart, [x, 0.075, z], [x, 0.94, z], 0.012, materials.metal);
      const wheel = cylinder(cart, 0.035, 0.022, [x, 0.035, z], materials.rubber);
      wheel.rotation.z = Math.PI / 2;
      box(cart, [0.04, 0.045, 0.03], [x, 0.068, z], materials.enamel);
    }
    rod(cart, [x, 0.92, -0.17], [x, 0.92, 0.17], 0.012, materials.metal);
  }
  for (const y of [0.18, 0.57, 0.9]) {
    roundBox(cart, [0.62, 0.025, 0.4], [0, y, 0], materials.enamel, 0.007);
    box(cart, [0.62, 0.045, 0.015], [0, y + 0.025, -0.2], materials.enamel);
  }
  const covers = [materials.navy, materials.rust, materials.mustard, materials.ivory];
  for (let index = 0; index < 7; index++) {
    const cover = covers[index % covers.length];
    if (!cover) throw new Error("本の材質が見つかりません。");
    const height = 0.25 + (index % 3) * 0.017;
    const book = new Group();
    box(book, [0.047, height, 0.22], [0, height / 2, 0], cover);
    box(book, [0.037, height - 0.012, 0.205], [0, height / 2, -0.004], materials.paper);
    box(book, [0.047, height, 0.009], [0, height / 2, 0.109], cover);
    box(book, [0.024, 0.045, 0.001], [0, height * 0.7, 0.115], materials.paper);
    book.position.set(-0.2 + index * 0.058, 0.193, 0.035);
    if (index === 6) book.rotation.z = -0.1;
    cart.add(book);
  }
  for (let index = 0; index < 3; index++) {
    const stack = roundBox(
      cart,
      [0.36, 0.043, 0.25],
      [-0.05, 0.604 + index * 0.043, 0.015],
      materials.paper,
      0.003,
    );
    stack.rotation.y = (index - 1) * 0.04;
  }
  const profile = [
    [0, 0],
    [0.031, 0],
    [0.04, 0.012],
    [0.043, 0.072],
    [0.038, 0.075],
    [0.035, 0.016],
    [0, 0.012],
  ].map(([x, y]) => new Vector2(x, y));
  const cup = new Mesh(new LatheGeometry(profile, 32), materials.ivory);
  cup.position.set(-0.12, 0.9205, 0.02);
  cup.castShadow = cup.receiveShadow = true;
  const handle = new Mesh(new TorusGeometry(0.022, 0.005, 8, 20), materials.ivory);
  handle.position.set(0.045, 0.042, 0);
  handle.castShadow = true;
  cup.add(handle);
  cart.add(cup);
  cylinder(cart, 0.062, 0.008, [-0.12, 0.9165, 0.02], materials.ivory);
  const notebook = roundBox(cart, [0.2, 0.025, 0.27], [0.14, 0.925, 0.015], materials.rust, 0.005);
  notebook.rotation.y = -0.1;
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
    const hook = new Mesh(new TubeGeometry(curve, 20, 0.009, 8, false), materials.deepGreen);
    hook.castShadow = hook.receiveShadow = true;
    stand.add(hook);
    cylinder(
      stand,
      0.013,
      0.036,
      [Math.cos(angle) * 0.205, 1.81, Math.sin(angle) * 0.205],
      materials.ash,
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
