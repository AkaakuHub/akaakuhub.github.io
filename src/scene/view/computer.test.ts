import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { createComputerInspection } from "./computer";
import { inspectionPose } from "./targets";
import { createDisplayOrientation } from "../furniture/computer/orientation";

vi.mock("../furniture/computer/screen", () => ({ createComputerScreen: () => new Texture() }));

function fixture() {
  const scene = new Scene();
  const computer = new Group();
  computer.rotation.y = Math.PI / 2;
  computer.position.set(-2, 0.7, 0);
  scene.add(computer);
  const tower = new Mesh(new BoxGeometry(0.23, 0.47, 0.43), new MeshBasicMaterial());
  tower.name = "white-desktop-tower";
  tower.position.set(0.54, 0.24, 0);
  const head = new Group();
  head.name = "computer-display-head";
  head.position.set(0, 0.333, -0.19);
  const screen = new Mesh(new PlaneGeometry(0.589, 0.331), new MeshBasicMaterial());
  screen.name = "computer-monitor";
  screen.position.z = 0.0145;
  head.add(screen);
  computer.add(tower, head);
  return { scene, head, screen, orient: createDisplayOrientation(head, screen) };
}

describe("PC画面へのフォーカス", () => {
  it.each([false, true])(
    "縦横それぞれのモニターを正面から画面内に収める: portrait=%s",
    (portrait) => {
      const { scene, screen, orient } = fixture();
      const computer = createComputerInspection(scene);
      orient(portrait);
      for (const [width, height] of [
        [1440, 900],
        [390, 844],
        [844, 390],
      ] as const) {
        const viewport = { width, height, insetX: 12, insetY: 12 };
        const pose = inspectionPose(computer.screen, viewport, { zoom: 1, panX: 0, panY: 0 });
        const camera = new PerspectiveCamera(pose.fov, viewport.width / viewport.height, 0.05, 40);
        camera.position.copy(pose.position);
        camera.quaternion.copy(pose.quaternion);
        camera.updateMatrixWorld();
        screen.updateWorldMatrix(true, false);
        const positions = screen.geometry.getAttribute("position");
        for (let index = 0; index < positions.count; index++) {
          const corner = new Vector3()
            .fromBufferAttribute(positions, index)
            .applyMatrix4(screen.matrixWorld)
            .project(camera);
          expect(Math.abs(corner.x)).toBeLessThan(1);
          expect(Math.abs(corner.y)).toBeLessThan(1);
          expect(corner.z).toBeGreaterThan(-1);
          expect(corner.z).toBeLessThan(1);
        }
        const ray = new Raycaster();
        ray.setFromCamera(new Vector2(), camera);
        expect(ray.intersectObjects([...computer.surfaces], true)[0]?.object).toBe(screen);
        expect(
          camera
            .getWorldDirection(new Vector3())
            .dot(new Vector3(0, 0, 1).transformDirection(screen.matrixWorld)),
        ).toBeCloseTo(-1);
      }
    },
  );

  it("縦横の変更後も画面寸法と選択対象が現在のモニターに一致する", () => {
    const { scene, screen, orient } = fixture();
    const computer = createComputerInspection(scene);
    for (const portrait of [true, false, true]) {
      orient(portrait);
      computer.resizeInspection();
      expect(computer.screen.object).toBe(screen);
      expect(computer.screen.width).toBe(portrait ? 0.331 : 0.589);
      expect(computer.screen.height).toBe(portrait ? 0.589 : 0.331);
    }
  });
});
