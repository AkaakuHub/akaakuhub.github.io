import type { Vector2 } from "three";
import type { assembleClubroom } from "../../scene/clubroom";
import type { createView } from "../../scene/view";
import type { ContentState } from "../../content/schema";
import { createComputerScreen } from "../../scene/furniture/computer/screen";
import { screenLayout } from "../../scene/furniture/computer/screen/layout";
import { createScreenScroll } from "../../scene/furniture/computer/screen/scroll";
import { prepareBoardFont } from "../../assets/typography";
import { loadReadme } from "../../content/readme";
import type { ReadmeState } from "../../content/readme";

export function createComputerInterface(
  computer: ReturnType<typeof assembleClubroom>["computer"],
  view: ReturnType<typeof createView>,
  invalidate: () => void,
  requestFrame: () => void,
) {
  const screen = createComputerScreen(computer.monitor.material);
  const readmes = new Map<string, ReadmeState>();
  const preparedText = new Set<string>();
  const compact = window.matchMedia("(max-width: 640px)");
  const scroll = createScreenScroll();
  let powered = false;
  let state: ContentState = { status: "loading" };
  let dirty = true;
  let revision = 0;
  let interactedAt = 0;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  screen.draw(false, state, 0, compact.matches, readmes);

  function redraw(name?: string) {
    screen.clear(name);
    dirty = true;
    requestFrame();
  }
  function fonts(name: string, text: string) {
    const key = name + text;
    if (preparedText.has(key)) return;
    preparedText.add(key);
    void prepareBoardFont(text)
      .then(() => redraw(name))
      .catch(console.error);
  }
  async function readme(name: string) {
    const current = revision;
    readmes.set(name, { status: "loading" });
    try {
      const text = await loadReadme(name);
      if (current !== revision) return;
      readmes.set(name, { status: "ready", text });
    } catch (error) {
      console.error(error);
      if (current !== revision) return;
      readmes.set(name, { status: "error" });
    }
    redraw(name);
  }
  compact.addEventListener("change", () => {
    scroll.reset();
    redraw();
  });
  const togglePower = () => {
    powered = !powered;
    computer.power.material.emissiveIntensity = powered ? 1 : 0;
    dirty = true;
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
    scroll(delta: number, immediate = false) {
      if (!powered || state.status !== "ready") return;
      scroll.move(delta, immediate);
      interactedAt = performance.now();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(requestFrame, 120);
      dirty = true;
      requestFrame();
    },
    click(uv: Vector2) {
      const action = screen.hit(uv.x, uv.y);
      if (!action) return;
      if (action.type === "github")
        window.open(
          "https://github.com/AkaakuHub?tab=repositories",
          "_blank",
          "noopener,noreferrer",
        );
      else window.open(action.repository.url, "_blank", "noopener,noreferrer");
    },
    setState(next: ContentState) {
      state = next;
      revision++;
      scroll.reset();
      scroll.setMaximum(
        screenLayout(
          next.status === "ready" ? next.content.repositories.length : 0,
          0,
          compact.matches,
        ).maximum,
      );
      readmes.clear();
      redraw();
    },
    update(seconds: number, now: number): boolean {
      const repositories = state.status === "ready" ? state.content.repositories : [];
      scroll.setMaximum(
        screenLayout(repositories.length, scroll.position, compact.matches).maximum,
      );
      const motion = scroll.update(seconds);
      const visible =
        powered &&
        (view.state.mode === "monitor" ||
          view.state.mode === "computer" ||
          (view.state.mode === "room" && view.state.direction === 1));
      if (visible) {
        const layout = screenLayout(repositories.length, scroll.position, compact.matches);
        for (const repository of repositories.slice(layout.start, layout.end)) {
          const readmeState = readmes.get(repository.name);
          const excerpt = readmeState?.status === "ready" ? readmeState.text : "";
          fonts(
            repository.name,
            [repository.name, repository.description, excerpt?.slice(0, 450)]
              .filter(Boolean)
              .join(" "),
          );
          if (!readmeState && !motion.active && !view.moving && now - interactedAt >= 100)
            void readme(repository.name);
        }
      }
      if (dirty || motion.changed) {
        screen.draw(powered, state, scroll.position, compact.matches, readmes);
        dirty = false;
      }
      return powered && motion.active;
    },
  };
}
