import { CatmullRomCurve3, Group, Mesh, MeshStandardMaterial, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundBox } from "../../geometry";
import { keyboardKeys } from "./layout";
import { keycapGeometry, keyTransform, pitch } from "./keycap";
import { keyLegends } from "./legends";

export function mechanicalKeyboard(): Group {
  const keyboard = new Group();
  keyboard.name = "mechanical-keyboard";
  const shell = new MeshStandardMaterial({ color: "#111615", roughness: 0.73 });
  const plate = new MeshStandardMaterial({ color: "#303634", roughness: 0.86, metalness: 0.15 });
  const keyMaterial = new MeshStandardMaterial({ color: "#202523", roughness: 0.8 });
  const width = 18.5 * pitch + 0.018;
  const depth = 6.5 * pitch + 0.014;
  roundBox(keyboard, [width, 0.011, depth], [0, 0.0065, 0], shell, 0.003);
  roundBox(keyboard, [width - 0.01, 0.002, depth - 0.01], [0, 0.012, 0], plate, 0.002);
  const parts = keyboardKeys.map((key) =>
    keycapGeometry(key).clone().applyMatrix4(keyTransform(key)),
  );
  const geometry = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!geometry) throw new Error("キーボードの形状をまとめられません。");
  keyboard.add(new Mesh(geometry, keyMaterial), keyLegends(keyboardKeys));
  for (const x of [-width * 0.38, width * 0.38])
    for (const z of [-depth * 0.35, depth * 0.35])
      roundBox(keyboard, [0.028, 0.002, 0.012], [x, 0.001, z], shell, 0.001);
  const cable = new CatmullRomCurve3([
    new Vector3(-0.1, 0.008, -depth / 2),
    new Vector3(-0.11, 0.005, -0.09),
    new Vector3(-0.065, 0.002, -0.15),
  ]);
  keyboard.add(new Mesh(new TubeGeometry(cable, 8, 0.0015, 5, false), shell));
  return keyboard;
}
