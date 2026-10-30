import type { PerspectiveCamera } from "three";
import type { assembleClubroom } from "../../scene/clubroom";
import type { createView } from "../../scene/view";
import { slideWindow } from "../../scene/room/window-panels";
import { createPassageInterface } from "./passage";

export function createRoomPassages(
  root: HTMLElement,
  camera: PerspectiveCamera,
  view: ReturnType<typeof createView>,
  {
    door,
    windowOpening,
  }: Pick<Awaited<ReturnType<typeof assembleClubroom>>, "door" | "windowOpening">,
  requestPassageFrame: (geometryChanged: boolean) => void,
  announce: (message: string) => void,
) {
  return [
    createPassageInterface(
      root,
      camera,
      view,
      {
        panel: door.leaf,
        destination: door.light,
        setAmount: (amount) => {
          door.pivot.rotation.y = amount * Math.PI * 0.56;
        },
        label: "ドア",
        direction: 3,
        color: "#ffffff",
        enterLabel: "ドアの先の光へ進む",
        enteringMessage: "光へ進んでいます",
      },
      requestPassageFrame,
      announce,
    ),
    createPassageInterface(
      root,
      camera,
      view,
      {
        panel: windowOpening.sash,
        destination: windowOpening.exit,
        setAmount: (amount) => {
          slideWindow(windowOpening.sash, amount);
        },
        label: "窓",
        direction: 1,
        color: "#000000",
        enterLabel: "窓の外へ進む",
        enteringMessage: "窓の外へ進んでいます",
      },
      requestPassageFrame,
      announce,
    ),
  ];
}
