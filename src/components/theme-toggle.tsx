"use client";

import clsx from "clsx";
import { Laptop, Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";

type Mode = "system" | "light" | "dark";

function indicatorClass(mode: Mode) {
  if (mode === "system") return "translate-y-[-1.1rem] bg-fg/90";
  if (mode === "light")
    return "translate-x-[1.5rem] translate-y-[-0.7rem] bg-primary";
  return "translate-x-[-3.5rem] translate-y-[-0.7rem] bg-secondary";
}

function iconClass(
  active: boolean,
  position: "top" | "rightBottom" | "leftBottom",
) {
  const base =
    "absolute h-8 w-8 flex items-center justify-center cursor-pointer text-muted transition-colors";
  const pos =
    position === "top"
      ? "top-1 left-1/2 -translate-x-1/2"
      : position === "rightBottom"
        ? "bottom-1 right-1"
        : "bottom-1 left-1";
  return clsx(base, pos, active ? "text-fg" : null);
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: the server render doesn't know localStorage.
  const mode: Mode = mounted ? theme : "system";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "relative h-12 w-32 border border-border/80 bg-surface/60 backdrop-blur transition-colors",
        "cut-corners",
        "hover:bg-surface/80",
      )}
      aria-label="テーマ切り替え"
    >
      <div className={iconClass(mode === "system", "top")}>
        <Laptop size={20} />
      </div>
      <div className={iconClass(mode === "light", "rightBottom")}>
        <SunMedium size={20} />
      </div>
      <div className={iconClass(mode === "dark", "leftBottom")}>
        <Moon size={20} />
      </div>

      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "h-8 w-8 p-2 text-bg",
          "cut-corners-xs",
          "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-border)_70%,transparent),0_18px_50px_color-mix(in_oklab,var(--color-fg)_18%,transparent)]",
          "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          indicatorClass(mode),
        )}
      >
        <div className="flex h-full w-full items-center justify-center">
          {mode === "system" ? <Laptop size={18} /> : null}
          {mode === "light" ? <SunMedium size={18} /> : null}
          {mode === "dark" ? <Moon size={18} /> : null}
        </div>
      </div>
    </button>
  );
}
