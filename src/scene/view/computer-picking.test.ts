import { Group, Object3D, PerspectiveCamera, Scene, Texture, Vector3 } from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { desktopComputer } from "../furniture/computer";
import { createComputerInspection } from "./computer";
import { createPicker } from "../../interface/picking";

vi.mock("../furniture/computer/screen", () => ({ createComputerScreen: () => new Texture() }));
vi.mock("../furniture/computer/keyboard", () => ({ mechanicalKeyboard: () => new Group() }));

describe("部室に配置したPC画面の選択", () => {
  it("筐体の遮蔽判定が画面のクリックを妨げない", () => {
    const scene = new Scene();
    const computer = desktopComputer();
    computer.position.set(-1.9, 0.796, 0.45);
    computer.rotation.y = Math.PI / 2;
    scene.add(computer);
    const inspection = createComputerInspection(scene);
    const screen = inspection.screen.object;
    const power = scene.getObjectByName("computer-power-button");
    if (!power) throw new Error("電源がありません。");
    const camera = new PerspectiveCamera(62, 1, 0.05, 40);
    camera.position.set(0, 1.55, 0.45);
    camera.lookAt(screen.getWorldPosition(new Vector3()));
    scene.updateMatrixWorld(true);
    const pick = createPicker(
      {
        getBoundingClientRect: () => ({
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 800,
          bottom: 800,
          width: 800,
          height: 800,
          toJSON: () => ({}),
        }),
      },
      camera,
      scene,
      [],
      { surfaces: inspection.surfaces, screen, power },
      new Object3D(),
      [],
    );
    expect(pick({ clientX: 400, clientY: 400, pointerType: "mouse" }, true)?.type).toBe("screen");
  });
});
