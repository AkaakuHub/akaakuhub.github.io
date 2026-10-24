import { Mesh, MeshStandardMaterial, PlaneGeometry, Scene, Texture } from "three";
import { describe, expect, it } from "vite-plus/test";
import { createBakedLighting, lightingFingerprint } from "../../src/scene/lighting/baked";

function fixture() {
  const scene = new Scene();
  const map = new Texture();
  map.name = "wall";
  const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshStandardMaterial({ map }));
  scene.add(mesh);
  const buffer = new ArrayBuffer(16 + 4 * 6 * 2);
  new Uint8Array(buffer).set(new TextEncoder().encode(lightingFingerprint(scene)));
  return { scene, mesh, buffer };
}

describe("段階的な読み込みと照明データ", () => {
  it("材質を待つ間に物体を隠しても、組み立てた形状へ照明を割り当てる", () => {
    const { scene, mesh, buffer } = fixture();
    const lighting = createBakedLighting(scene);
    mesh.visible = false;
    mesh.material.map = null;
    lighting.apply(buffer);
    expect(mesh.geometry.getAttribute("bakedFluorescent").count).toBe(4);
    expect(mesh.geometry.getAttribute("bakedSky").count).toBe(4);
  });

  it("別の形状から生成した照明データを拒否する", () => {
    const { scene, mesh, buffer } = fixture();
    mesh.position.x = 1;
    const lighting = createBakedLighting(scene);
    expect(() => lighting.apply(buffer)).toThrow("部屋の形状と照明のベイクデータが一致しません。");
  });
});
