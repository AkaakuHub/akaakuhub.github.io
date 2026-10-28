import {
  DirectionalLight,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RectAreaLight,
  Texture,
} from "three";
import {
  DirectionalLightNode,
  MeshBasicNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  RectAreaLightNode,
} from "three/webgpu";
import { describe, expect, it } from "vite-plus/test";
import { RoomNodeLibrary } from "./node-library";

describe("部室の材質と光源の変換", () => {
  const library = new RoomNodeLibrary();

  it("PMREMの背景にも使う基本材質の色と画像を引き継ぐ", () => {
    const material = new MeshBasicMaterial({ color: 0x254c72, map: new Texture() });
    const converted = library.fromMaterial(material);
    expect(converted).toBeInstanceOf(MeshBasicNodeMaterial);
    if (!(converted instanceof MeshBasicNodeMaterial))
      throw new Error("基本材質を変換できません。");
    expect(converted.color).toBe(material.color);
    expect(converted.map).toBe(material.map);
  });

  it("標準材質のPBR画像と表面の設定を引き継ぐ", () => {
    const material = new MeshStandardMaterial({
      normalMap: new Texture(),
      roughnessMap: new Texture(),
      aoMap: new Texture(),
      roughness: 0.73,
      metalness: 0.2,
    });
    const converted = library.fromMaterial(material);
    expect(converted).toBeInstanceOf(MeshStandardNodeMaterial);
    if (!(converted instanceof MeshStandardNodeMaterial))
      throw new Error("標準材質を変換できません。");
    expect(converted.normalMap).toBe(material.normalMap);
    expect(converted.roughnessMap).toBe(material.roughnessMap);
    expect(converted.aoMap).toBe(material.aoMap);
    expect(converted.roughness).toBe(0.73);
    expect(converted.metalness).toBe(0.2);
  });

  it("物理材質の透過とコーティングと布の反射を維持する", () => {
    const material = new MeshPhysicalMaterial({
      clearcoat: 0.65,
      clearcoatRoughness: 0.32,
      transmission: 0.7,
      thickness: 0.002,
      sheen: 0.8,
      sheenColor: 0xc1b9a0,
    });
    const converted = library.fromMaterial(material);
    expect(converted).toBeInstanceOf(MeshPhysicalNodeMaterial);
    if (!(converted instanceof MeshPhysicalNodeMaterial))
      throw new Error("物理材質を変換できません。");
    expect(converted.clearcoat).toBe(0.65);
    expect(converted.clearcoatRoughness).toBe(0.32);
    expect(converted.transmission).toBe(0.7);
    expect(converted.thickness).toBe(0.002);
    expect(converted.sheen).toBe(0.8);
    expect(converted.sheenColor).toBe(material.sheenColor);
  });

  it("影や合成に使うノード材質を作り直さない", () => {
    const material = new MeshBasicNodeMaterial({ depthWrite: false, toneMapped: false });
    expect(library.fromMaterial(material)).toBe(material);
  });

  it("天体光と影付きの矩形光源にThree.jsの実装を使う", () => {
    expect(library.getLightNodeClass(DirectionalLight)).toBe(DirectionalLightNode);
    expect(library.getLightNodeClass(RectAreaLight)).toBe(RectAreaLightNode);
  });
});
