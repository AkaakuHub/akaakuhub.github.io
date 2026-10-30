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
