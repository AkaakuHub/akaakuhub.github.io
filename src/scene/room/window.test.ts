import { Box3, Group, Mesh, MeshStandardMaterial, Raycaster, Texture, Vector3 } from "three";
import { describe, expect, it } from "vite-plus/test";
import type { MaterialLibrary, PbrMaps } from "../materials/library";
import { createMetalMaterials } from "../materials/metal";
import { thinGlassMaterial } from "../materials/props/glass";
import { createArchitectureMaterials } from "./materials/architecture";
import { createWindow } from "./window";
import { slideWindow } from "./window-panels";

function fixture() {
  const surface: PbrMaps = {
    map: new Texture(),
    normalMap: new Texture(),
    roughnessMap: new Texture(),
    aoMap: null,
    alphaMap: null,
  };
  const materials: MaterialLibrary = {
    floor: surface,
    plaster: surface,
    ceiling: surface,
    oak: surface,
    walnut: surface,
    fabric: surface,
    aluminum: surface,
    paint: surface,
    steel: surface,
    powder: surface,
    paper: surface,
    plastic: surface,
  };
  return createWindow(
    createArchitectureMaterials(materials),
    materials.fabric,
    createMetalMaterials(materials),
    { glass: thinGlassMaterial(), paper: new MeshStandardMaterial() },
  );
}

describe("窓から見える屋外", () => {
  it("ベランダの全支柱を床に固定し、前面と側面の手すりへ接続する", () => {
    const window = fixture();
    window.updateMatrixWorld(true);
    const slab = window.getObjectByName("balcony-slab");
    if (!slab) throw new Error("ベランダの床がありません。");
    const floor = new Box3().setFromObject(slab);
    const posts = window.getObjectsByProperty("name", "balcony-post");
    const rails = window.getObjectsByProperty("name", "balcony-rail");
    expect(posts).toHaveLength(5);
    for (const post of posts) {
      const bounds = new Box3().setFromObject(post);
      expect(bounds.min.y).toBeCloseTo(floor.max.y);
      const foot = bounds.getCenter(new Vector3());
      foot.y = floor.max.y - 0.001;
      expect(floor.containsPoint(foot)).toBe(true);
      expect(rails.some((rail) => bounds.intersectsBox(new Box3().setFromObject(rail)))).toBe(true);
    }
  });

  it("下段の開口部に固定柱を残さず、可動枠が固定枠に衝突せずに重なる", () => {
    const window = fixture();
    const sash = window.getObjectByName("room-window-sash");
    if (!(sash instanceof Group)) throw new Error("窓の可動枠がありません。");
    const columns = window.getObjectsByProperty("name", "room-window-mullion");
    expect(columns).toHaveLength(2);
    const fixedStiles = window
      .getObjectsByProperty("name", "room-window-sash-stile")
      .filter((stile) => stile.parent !== sash);
    expect(fixedStiles).toHaveLength(4);
    for (let step = 0; step <= 10; step++) {
      slideWindow(sash, step / 10);
      window.updateMatrixWorld(true);
      for (const stile of sash.getObjectsByProperty("name", "room-window-sash-stile")) {
        const bounds = new Box3().setFromObject(stile);
        for (const column of [...columns, ...fixedStiles])
          expect(bounds.intersectsBox(new Box3().setFromObject(column))).toBe(false);
      }
    }
    const pane = sash.getObjectByName("room-window-lower-pane");
    const exit = window.getObjectByName("room-window-exit");
    if (!pane || !exit) throw new Error("窓のガラスと開口部がありません。");
    const opening = new Box3().setFromObject(exit);
    const paneBounds = new Box3().setFromObject(pane);
    expect(paneBounds.max.z).toBeLessThan(opening.min.z);
  });

  it("移動先の当たり判定を有効にしても奥を隠す物体を描かない", () => {
    const window = fixture();
    const exit = window.getObjectByName("room-window-exit");
    if (!(exit instanceof Mesh) || Array.isArray(exit.material))
      throw new Error("窓の移動先がありません。");
    exit.visible = true;
    window.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0, 1.61, 0.45), new Vector3(-1, 0, 0));
    expect(ray.intersectObject(exit).length).toBeGreaterThan(0);
    expect(exit.material.visible).toBe(false);
  });

  it("窓を開閉してもベランダの床と手すりの位置・可視性を保つ", () => {
    const window = fixture();
    const sash = window.getObjectByName("room-window-sash");
    const balcony = window.getObjectByName("window-balcony");
    if (!(sash instanceof Group) || !balcony) throw new Error("窓とベランダがありません。");
    window.updateMatrixWorld(true);
    const before = new Box3().setFromObject(balcony);
    slideWindow(sash, 1);
    window.updateMatrixWorld(true);
    expect(new Box3().setFromObject(balcony).equals(before)).toBe(true);
    expect(balcony.visible).toBe(true);
    expect(before.min.x).toBeLessThan(-4);
    expect(before.max.y).toBeGreaterThan(1);
    slideWindow(sash, 0);
    window.updateMatrixWorld(true);
    expect(new Box3().setFromObject(balcony).equals(before)).toBe(true);
  });
});
