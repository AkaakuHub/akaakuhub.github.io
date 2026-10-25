import type { Object3D, PerspectiveCamera } from "three";
import { Scene } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import type { ContributionState } from "../../content/contributions";
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
  const image = new Image();
  image.alt = "";
  const object = new CSS3DObject(image);
  Object.assign(image.style, { pointerEvents: "none", backfaceVisibility: "hidden" });
  object.scale.setScalar(1 / 1200);
  object.position.set(0, -0.045, 0.006);
  object.visible = false;
  object.updateMatrix();
  object.matrixAutoUpdate = false;
  object.matrixWorldAutoUpdate = false;
  const scene = new Scene();
  scene.add(object);
  let state: ContributionState = { status: "loading" };
  let view: "board" | "profile" | null = null;
  let url: string | undefined;

  function reset() {
    object.visible = false;
    image.removeAttribute("src");
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }

  return {
    setState(next: ContributionState) {
      reset();
      state = next;
    },
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
      if (view && state.status === "ready" && !url && !moving) {
        const width = Math.min(1080, (300 * state.image.width) / state.image.height);
        image.width = Math.round(width);
        image.height = Math.round((width * state.image.height) / state.image.width);
        object.visible = true;
        url = URL.createObjectURL(state.image.source);
        image.src = url;
      }
      paper.updateWorldMatrix(true, false);
      object.matrixWorld.multiplyMatrices(paper.matrixWorld, object.matrix);
      renderer.render(scene, camera);
    },
  };
}
