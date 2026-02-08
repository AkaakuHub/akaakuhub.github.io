"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/reduced-motion";

function setBg(el: HTMLDivElement, url: string) {
  el.style.backgroundImage = `url("${url}")`;
}

type Layer = "A" | "B";

export default function BackdropStage({
  imageUrl,
}: {
  imageUrl: string | null;
}) {
  const bgARef = useRef<HTMLDivElement | null>(null);
  const bgBRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<Layer>("A");

  useEffect(() => {
    const a = bgARef.current;
    const b = bgBRef.current;
    if (!a || !b) return;

    if (!imageUrl) {
      a.style.backgroundImage = "";
      b.style.backgroundImage = "";
      a.style.opacity = "0";
      b.style.opacity = "0";
      return;
    }

    const reduced = prefersReducedMotion();
    const top = topRef.current === "A" ? a : b;
    const bottom = topRef.current === "A" ? b : a;

    if (reduced) {
      setBg(top, imageUrl);
      setBg(bottom, imageUrl);
      top.style.opacity = "1";
      bottom.style.opacity = "0";
      return;
    }

    const img = new Image();
    img.decoding = "async";
    img.src = imageUrl;
    img.onload = () => {
      setBg(bottom, imageUrl);
      gsap.set(bottom, { opacity: 0, filter: "blur(14px) contrast(1.15)" });
      gsap.to(bottom, {
        opacity: 1,
        filter: "blur(0px) contrast(1)",
        duration: 0.78,
        ease: "power2.out",
      });
      gsap.to(top, { opacity: 0, duration: 0.78, ease: "power2.out" });
      topRef.current = topRef.current === "A" ? "B" : "A";
    };
  }, [imageUrl]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <div
          ref={bgARef}
          className="absolute inset-0 bg-cover bg-center opacity-0 [transform:scale(1.05)]"
        />
        <div
          ref={bgBRef}
          className="absolute inset-0 bg-cover bg-center opacity-0 [transform:scale(1.05)]"
        />
      </div>

      <div className="absolute inset-0 ui-grid" />
      <div className="absolute inset-0 scanlines" />
      <div className="absolute inset-0 ink-wash" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--color-bg)_35%,transparent),color-mix(in_oklab,var(--color-bg)_65%,transparent)_45%,var(--color-bg))]" />
    </div>
  );
}
