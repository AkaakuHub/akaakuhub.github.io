import type { Vector2 } from "three";
import type { assembleClubroom } from "../../scene/clubroom";
import type { createView } from "../../scene/view";
import type { BoardState } from "../../scene/board/notices";
import { createComputerScreen } from "../../scene/furniture/computer/screen";
import { screenPage } from "../../scene/furniture/computer/screen/layout";
import { loadReadme } from "../../content/readme";
import type { ReadmeState } from "../../content/readme";

export function createComputerInterface(
  computer: ReturnType<typeof assembleClubroom>["computer"],
  view: ReturnType<typeof createView>,
  invalidate: () => void,
) {
  const screen = createComputerScreen(computer.monitor.material);
  const readmes = new Map<string, ReadmeState>();
  const compact = window.matchMedia("(max-width: 640px)");
  let powered = false;
  let state: BoardState = { status: "loading" };
  let page = 0;
  function draw() {
    screen.draw(powered, state, page, compact.matches, readmes);
  }
  async function readme(name: string) {
    readmes.set(name, { status: "loading" });
    try {
      readmes.set(name, { status: "ready", text: await loadReadme(name) });
    } catch (error) {
      console.error(error);
      readmes.set(name, { status: "error" });
    }
    if (powered) draw();
    invalidate();
  }
  function updateReadmes() {
    if (!powered || state.status !== "ready" || view.state.mode !== "monitor" || view.moving)
      return;
    const pagination = screenPage(page, state.content.repositories.length, compact.matches);
    for (const repository of state.content.repositories.slice(
      pagination.start,
      pagination.start + pagination.size,
    ))
      if (!readmes.has(repository.name)) void readme(repository.name);
  }
  function scroll(step: number) {
    if (!powered || state.status !== "ready") return;
    const next = screenPage(page + step, state.content.repositories.length, compact.matches).page;
    if (next === page) return;
    page = next;
    draw();
    invalidate();
  }
  compact.addEventListener("change", () => {
    page = 0;
    draw();
    updateReadmes();
    invalidate();
  });
  draw();
  const togglePower = () => {
    powered = !powered;
    computer.power.material.emissiveIntensity = powered ? 1 : 0;
    draw();
    if (!powered && view.state.mode === "monitor") view.inspectComputer();
    invalidate();
  };
  return {
    targets: {
      object: computer.object,
      monitor: computer.monitor,
      power: computer.power,
      isPowered: () => powered,
    },
    togglePower,
    scroll,
    click(uv: Vector2) {
      const action = screen.hit(uv.x, uv.y);
      if (!action) return;
      if (action.type === "back") view.inspectComputer();
      else if (action.type === "previous") scroll(-1);
      else if (action.type === "next") scroll(1);
      else if (action.type === "github")
        window.open(
          "https://github.com/AkaakuHub?tab=repositories",
          "_blank",
          "noopener,noreferrer",
        );
      else window.open(action.repository.url, "_blank", "noopener,noreferrer");
    },
    setState(next: BoardState) {
      state = next;
      page = 0;
      readmes.clear();
      if (powered) draw();
      updateReadmes();
    },
    update: updateReadmes,
  };
}
