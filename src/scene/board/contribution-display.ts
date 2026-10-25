import type { Object3D, PerspectiveCamera } from "three";
import { Scene } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import type { ViewState } from "../view";

export function createContributionDisplay(
  container: HTMLElement,
  paper: Object3D,
  camera: PerspectiveCamera,
) {
  const renderer = new CSS3DRenderer();
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
  });
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  const element = document.createElement("div");
  const object = new CSS3DObject(element);
  Object.assign(element.style, {
    pointerEvents: "none",
    backfaceVisibility: "hidden",
    width: "844px",
    height: "300px",
  });
  object.scale.setScalar(1 / 1200);
  object.position.set(0, -0.045, 0.006);
  object.visible = false;
  object.updateMatrix();
  object.matrixAutoUpdate = false;
  object.matrixWorldAutoUpdate = false;
  const scene = new Scene();
  scene.add(object);
  let view: "board" | "profile" | null = null;
  let started = false;

  function reset() {
    object.visible = false;
    element.replaceChildren();
    started = false;
  }

  return {
    setView(next: ViewState) {
      const visible =
        next.mode === "room" && next.direction === 0
          ? "board"
          : next.mode === "notice" && next.index === 0
            ? "profile"
            : null;
      if (visible === view) return;
      view = visible;
      reset();
    },
    setSize(width: number, height: number) {
      renderer.setSize(width, height);
    },
    render(moving: boolean) {
      if (view && !started && !moving) {
        const image = new Image(844, 300);
        image.alt = "";
        image.crossOrigin = "anonymous";
        image.src =
          "https://raw.githubusercontent.com/AkaakuHub/github-grass/refs/heads/main/github-glass.svg";
        element.replaceChildren(image);
        object.visible = true;
        started = true;
      }
      paper.updateWorldMatrix(true, false);
      object.matrixWorld.multiplyMatrices(paper.matrixWorld, object.matrix);
      renderer.render(scene, camera);
    },
  };
}
