import { Texture } from "three";
import { MeshStandardNodeMaterial, Renderer } from "three/webgpu";
import { float, vec3 } from "three/tsl";
import { describe, expect, it } from "vite-plus/test";

function shadowNodes(material: MeshStandardNodeMaterial): object {
  const method: unknown = Reflect.get(Renderer.prototype, "_getShadowNodes");
  if (typeof method !== "function") throw new Error("影の材質を準備できません。");
  const result: unknown = method.call(
    { _cacheShadowNodes: new WeakMap(), shadowMap: { transmitted: false } },
    material,
  );
  if (typeof result !== "object" || result === null) throw new Error("影の材質を取得できません。");
  return result;
}

describe("影のシェーダー", () => {
  it("不透明な材質では色画像と色ノードを影の計算に持ち込まない", () => {
    const material = new MeshStandardNodeMaterial({ map: new Texture() });
    material.colorNode = vec3(0.5);
    expect(shadowNodes(material)).toMatchObject({ colorNode: null });
  });

  it.each([{ transparent: true }, { alphaTest: 0.5 }, { alphaHash: true }])(
    "透過・切り抜きの影では画像の透明度を維持する: %o",
    (parameters) => {
      const material = new MeshStandardNodeMaterial({ map: new Texture(), ...parameters });
      expect(shadowNodes(material)).not.toMatchObject({ colorNode: null });
    },
  );

  it("不透明な材質でも明示した影のマスクと頂点変形を維持する", () => {
    const material = new MeshStandardNodeMaterial({ map: new Texture() });
    material.maskShadowNode = float(1).greaterThan(0);
    material.castShadowPositionNode = vec3(1, 2, 3);
    expect(shadowNodes(material)).not.toMatchObject({ colorNode: null });
    expect(shadowNodes(material)).toMatchObject({ positionNode: material.castShadowPositionNode });
  });
});
