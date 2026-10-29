import { MeshBasicMaterial, Raycaster, Vector3 } from "three";
import type { Object3D } from "three";
import { describe, expect, it } from "vite-plus/test";
import { createWindowPanels, slideWindow } from "./window-panels";

function fixture() {
  const material = new MeshBasicMaterial();
  return createWindowPanels(material, material, material, material);
}

function belongsTo(object: Object3D, parent: Object3D): boolean {
  for (let owner: Object3D | null = object; owner; owner = owner.parent)
    if (owner === parent) return true;
  return false;
}

describe("1枚だけ開く窓", () => {
  it("上の小窓、横桟、隣の窓を動かさず、下の1枚だけをスライドする", () => {
    const { group, sash } = fixture();
    const fixed = new Map<Object3D, Vector3>();
    group.updateMatrixWorld(true);
    group.traverse((object) => {
      if (!belongsTo(object, sash)) fixed.set(object, object.getWorldPosition(new Vector3()));
    });
    expect(sash.getObjectsByProperty("name", "room-window-lower-pane")).toHaveLength(1);
    expect(sash.getObjectsByProperty("name", "room-window-upper-pane")).toHaveLength(0);
    expect(sash.getObjectsByProperty("name", "room-window-transom")).toHaveLength(0);
    const pane = sash.getObjectByName("room-window-lower-pane");
    if (!pane) throw new Error("可動ガラスがありません。");
    const before = pane.getWorldPosition(new Vector3());
    slideWindow(sash, 1);
    group.updateMatrixWorld(true);
    expect(pane.getWorldPosition(new Vector3()).distanceTo(before)).toBeGreaterThan(1);
    for (const [object, position] of fixed)
      expect(object.getWorldPosition(new Vector3()).equals(position)).toBe(true);
  });

  it("開いた窓が隣のガラスの手前に残り、クリックして閉じる対象として選べる", () => {
    const { group, sash } = fixture();
    slideWindow(sash, 1);
    group.updateMatrixWorld(true);
    const hitArea = sash.getObjectByName("room-window-hit-area");
    if (!hitArea) throw new Error("窓の選択対象がありません。");
    const origin = new Vector3(0, 1.55, 0.45);
    const direction = hitArea.getWorldPosition(new Vector3()).sub(origin).normalize();
    const raycaster = new Raycaster(origin, direction);
    const candidate = raycaster.intersectObject(sash, true)[0];
    expect(candidate).toBeDefined();
    if (!candidate) return;
    const blocked = raycaster
      .intersectObject(group, true)
      .some(
        (hit) =>
          hit.object.visible && !belongsTo(hit.object, sash) && hit.distance < candidate.distance,
      );
    expect(blocked).toBe(false);
    const closedPositions = new Map<Object3D, Vector3>();
    slideWindow(sash, 0);
    group.updateMatrixWorld(true);
    sash.traverse((object) => closedPositions.set(object, object.getWorldPosition(new Vector3())));
    slideWindow(sash, 1);
    slideWindow(sash, 0);
    group.updateMatrixWorld(true);
    for (const [object, position] of closedPositions)
      expect(object.getWorldPosition(new Vector3()).equals(position)).toBe(true);
  });
});
