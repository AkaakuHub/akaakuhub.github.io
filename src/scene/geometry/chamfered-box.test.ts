import { Raycaster, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { describe, expect, it } from "vite-plus/test";
import { chamferedBoxGeometry } from "./chamfered-box";
import { orientWoodGrain } from "../materials/wood-grain";

describe("木製パネルの面取り", () => {
  it("指定した外寸と薄い面取りを保ち、三角形数を抑える", () => {
    const geometry = chamferedBoxGeometry([0.79, 0.232, 0.028], 0.001);
    const size = geometry.boundingBox?.getSize(new Vector3());
    expect(size?.x).toBeCloseTo(0.79);
    expect(size?.y).toBeCloseTo(0.232);
    expect(size?.z).toBeCloseTo(0.028);
    expect(geometry.index?.count).toBeLessThanOrEqual(48 * 3);
  });

  it("全ての面が外向きで、影と反射に使う法線を正規化する", () => {
    const geometry = chamferedBoxGeometry([1.72, 0.048, 0.56], 0.0015).toNonIndexed();
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    for (let index = 0; index < positions.count; index += 3) {
      const a = new Vector3().fromBufferAttribute(positions, index);
      const b = new Vector3().fromBufferAttribute(positions, index + 1);
      const c = new Vector3().fromBufferAttribute(positions, index + 2);
      const normal = new Vector3().fromBufferAttribute(normals, index);
      expect(b.sub(a).cross(c.sub(a)).dot(normal)).toBeGreaterThan(0);
      expect(normal.length()).toBeCloseTo(1);
    }
    geometry.dispose();
  });

  it("角と辺を含めた全方向で穴がない", () => {
    const mesh = new Mesh(
      chamferedBoxGeometry([0.94, 0.022, 0.45], 0.0007),
      new MeshBasicMaterial(),
    );
    mesh.updateMatrixWorld();
    for (const x of [-1, 0, 1])
      for (const y of [-1, 0, 1])
        for (const z of [-1, 0, 1]) {
          if (x === 0 && y === 0 && z === 0) continue;
          const from = new Vector3(x * 0.47, y * 0.011, z * 0.225).normalize().multiplyScalar(2);
          const ray = new Raycaster(from, from.clone().negate().normalize());
          expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
        }
  });

  it.each([
    { axis: "x" as const, size: [5.2, 0.038, 0.065] as const },
    { axis: "y" as const, size: [0.05, 1.8, 0.08] as const },
    { axis: "z" as const, size: [0.32, 0.055, 4.13] as const },
  ])("面取りした長い部材でも木目の向きと実寸を保つ: $axis", ({ axis, size }) => {
    const source = chamferedBoxGeometry(size, 0.001);
    const mesh = new Mesh(source, new MeshBasicMaterial());
    orientWoodGrain(mesh, axis, "v");
    expect(mesh.geometry).not.toBe(source);
    const positions = mesh.geometry.getAttribute("position");
    const normals = mesh.geometry.getAttribute("normal");
    const uv = mesh.geometry.getAttribute("uv");
    const normal = new Vector3();
    const point = new Vector3();
    for (let index = 0; index < positions.count; index++) {
      normal.fromBufferAttribute(normals, index);
      if (Math.abs(normal[axis]) >= 0.9) continue;
      point.fromBufferAttribute(positions, index);
      expect(uv.getY(index)).toBe(point[axis]);
    }
  });
});
