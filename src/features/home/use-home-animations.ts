"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { useLayoutEffect } from "react";
import { prefersReducedMotion } from "@/lib/reduced-motion";

gsap.registerPlugin(ScrollTrigger);

export function useHomeAnimations(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { y: 18, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.085,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 82%" },
          },
        );
      });
    }, el);

    return () => ctx.revert();
  }, [root]);
}
