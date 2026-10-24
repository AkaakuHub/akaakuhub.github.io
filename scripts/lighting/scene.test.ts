import {
  BoxGeometry,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Vector3,
} from "three";
import { describe, expect, it } from "vite-plus/test";
import { createBakeScene } from "./scene";
import { createLightSampler } from "./sources";
import { fixtureHeight, fixturePositions } from "../../src/scene/lighting/fixtures";

describe("ベイクの遮蔽と材質", () => {
  it("蛍光管を反射面として扱わず、光源への光線だけを通す", () => {
    const scene = new Scene();
    const tube = new Mesh(new PlaneGeometry(2, 2), new MeshStandardMaterial());
    tube.name = "room-fluorescent";
    scene.add(tube);
    const geometry = createBakeScene(scene);
    const point = new Vector3(0, 0, 1);
    const direction = new Vector3(0, 0, -1);
    try {
      expect(geometry.trace(point, direction)?.emitter).toBe(true);
      expect(geometry.visibility(point, direction, 2)).toBe(0);
      expect(geometry.visibility(point, direction, 2, true)).toBe(1);
    } finally {
      geometry.dispose();
    }
  });
  it("結合した形状でも光線が当たった面の材質を返す", () => {
    const scene = new Scene();
    const red = new MeshStandardMaterial({ color: "red" });
    const green = new MeshStandardMaterial({ color: "green" });
    for (const [x, material] of [
      [-1, red],
      [1, green],
    ] as const) {
      const mesh = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), material);
      mesh.position.x = x;
      scene.add(mesh);
    }
    const geometry = createBakeScene(scene);
    try {
      expect(geometry.trace(new Vector3(-1, 0, 2), new Vector3(0, 0, -1))?.material).toBe(red);
      expect(geometry.trace(new Vector3(1, 0, 2), new Vector3(0, 0, -1))?.material).toBe(green);
    } finally {
      geometry.dispose();
    }
  });

  it("一枚の布では光の25%を通し、重なった布では重ねて減衰する", () => {
    const scene = new Scene();
    for (const z of [0, -1]) {
      const cloth = new Mesh(new PlaneGeometry(2, 2), new MeshStandardMaterial());
      cloth.position.z = z;
      cloth.customDepthMaterial = new MeshDepthMaterial();
      scene.add(cloth);
    }
    const geometry = createBakeScene(scene);
    try {
      expect(geometry.visibility(new Vector3(0, 0, 1), new Vector3(0, 0, -1), 1.5)).toBeCloseTo(
        0.25,
      );
      expect(geometry.visibility(new Vector3(0, 0, 1), new Vector3(0, 0, -1), 3)).toBeCloseTo(
        0.0625,
      );
    } finally {
      geometry.dispose();
    }
  });
});

describe("蛍光管の配光", () => {
  it("管の上側と下側の両方を同じ光束で照らす", () => {
    const scene = new Scene();
    const distant = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    distant.position.set(20, 0, 0);
    scene.add(distant);
    const geometry = createBakeScene(scene);
    const light = createLightSampler(geometry);
    try {
      const lower = light.direct(
        new Vector3(0, fixtureHeight - 0.1, fixturePositions[0]),
        new Vector3(0, 1, 0),
      ).fluorescent;
      const upper = light.direct(
        new Vector3(0, fixtureHeight + 0.1, fixturePositions[0]),
        new Vector3(0, -1, 0),
      ).fluorescent;
      expect(lower).toBeGreaterThan(0);
      expect(upper).toBeCloseTo(lower, 8);
    } finally {
      geometry.dispose();
    }
  });

  it("家具が遮る光を受光面へ通さない", () => {
    const scene = new Scene();
    const shelf = new Mesh(new BoxGeometry(2, 0.02, 4), new MeshStandardMaterial());
    shelf.position.set(0, fixtureHeight - 0.06, 0.15);
    scene.add(shelf);
    const geometry = createBakeScene(scene);
    try {
      const light = createLightSampler(geometry).direct(
        new Vector3(0, fixtureHeight - 0.15, fixturePositions[0]),
        new Vector3(0, 1, 0),
      );
      expect(light.fluorescent).toBe(0);
    } finally {
      geometry.dispose();
    }
  });
});
