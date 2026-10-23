import { CircleGeometry, Group, LatheGeometry, Mesh, Vector2 } from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { box } from "../primitives";
import { cylinder, leaf, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

function books(parent: Group, x: number, y: number, materials: FurnitureMaterials): void {
  const colors = [
    materials.navy,
    materials.rust,
    materials.mustard,
    materials.deepGreen,
    materials.ivory,
  ];
  for (let index = 0; index < 7; index++) {
    const color = colors[index % colors.length];
    if (!color) throw new Error("本の材質が見つかりませんでした。");
    const book = new Group();
    const height = 0.24 + (index % 3) * 0.026;
    const thickness = 0.033 + (index % 2) * 0.014;
    box(book, [thickness, height, 0.2], [0, height / 2, 0], color);
    box(book, [thickness * 0.78, height - 0.01, 0.192], [0, height / 2, 0.006], materials.paper);
    box(book, [thickness, height, 0.007], [0, height / 2, -0.103], color);
    box(book, [thickness * 0.6, 0.067, 0.001], [0, height * 0.7, -0.107], materials.paper);
    book.position.set(x + index * 0.055, y, -0.014);
    parent.add(book);
  }
}

export function cabinetContents(parent: Group, materials: FurnitureMaterials): void {
  books(parent, -0.37, 0.645, materials);
  books(parent, -0.36, 1.465, materials);
  for (const x of [-0.23, 0.23]) {
    roundBox(parent, [0.33, 0.2, 0.32], [x, 1.145, 0.015], materials.graphite, 0.012);
    box(parent, [0.105, 0.044, 0.002], [x, 1.16, -0.15], materials.paper);
    box(parent, [0.046, 0.006, 0.004], [x, 1.12, -0.154], materials.brass);
  }
  for (let index = 0; index < 4; index++) {
    const paper = roundBox(
      parent,
      [0.24, 0.016, 0.3],
      [0.26, 1.485 + index * 0.018, 0.015],
      materials.paper,
      0.002,
    );
    paper.rotation.y = index * 0.015;
  }
}

function vase(materials: FurnitureMaterials): Group {
  const group = new Group();
  const profile = [
    [0, 0],
    [0.065, 0],
    [0.073, 0.025],
    [0.078, 0.1],
    [0.065, 0.18],
    [0.035, 0.24],
    [0.037, 0.27],
  ].map(([x, y]) => new Vector2(x, y));
  const vessel = new Mesh(new LatheGeometry(profile, 32), materials.terracotta);
  vessel.castShadow = vessel.receiveShadow = true;
  group.add(vessel);
  cylinder(group, 0.033, 0.005, [0, 0.266, 0], materials.graphite);
  for (const direction of [-1, 0, 1]) {
    rod(
      group,
      [0, 0.25, 0],
      [direction * 0.065, 0.53 + Math.abs(direction) * 0.035, direction * 0.02],
      0.0025,
      materials.foliage,
    );
    leaf(
      group,
      [direction * 0.06 - 0.02, 0.44, direction * 0.02],
      direction * 0.5 - 0.4,
      materials.foliage,
    );
    leaf(
      group,
      [direction * 0.06 + 0.01, 0.5, direction * 0.02],
      direction * 0.5 + 0.5,
      materials.foliage,
    );
  }
  return group;
}

function mirror(materials: FurnitureMaterials): Group {
  const group = new Group();
  cylinder(group, 0.11, 0.025, [0, 0.0125, 0], materials.walnut);
  rod(group, [0, 0.025, 0.025], [0, 0.3, 0.025], 0.008, materials.brass);
  const head = new Group();
  head.position.y = 0.3;
  head.rotation.x = -0.12;
  cylinder(head, 0.17, 0.023, [0, 0, 0], materials.brass).rotation.x = Math.PI / 2;
  const face = new Reflector(new CircleGeometry(0.156, 48), {
    textureWidth: 384,
    textureHeight: 384,
    clipBias: 0.002,
    color: "#d6dbd6",
    multisample: 0,
  });
  face.position.set(0, 0, -0.014);
  face.rotation.y = Math.PI;
  const reflect = face.onBeforeRender.bind(face);
  face.onBeforeRender = (renderer, scene, camera, geometry, material, renderGroup) => {
    if (scene.overrideMaterial) return;
    reflect(renderer, scene, camera, geometry, material, renderGroup);
  };
  head.add(face);
  group.add(head);
  return group;
}

export function tabletopObjects(parent: Group, materials: FurnitureMaterials): void {
  const flowers = vase(materials);
  flowers.position.set(-0.58, 0.971, -0.03);
  const tabletopMirror = mirror(materials);
  tabletopMirror.position.set(0.48, 0.971, 0.02);
  parent.add(flowers, tabletopMirror);
  roundBox(parent, [0.38, 0.07, 0.25], [-0.05, 1.006, 0.02], materials.navy, 0.012);
  box(parent, [0.17, 0.025, 0.001], [-0.05, 1.014, -0.108], materials.paper);
  box(parent, [0.025, 0.025, 0.005], [-0.05, 0.992, -0.113], materials.brass);
}
