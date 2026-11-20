"use client";

import { useEffect, useRef } from "react";

// The hero photo (a hand holding a phone) with the live page laid exactly over
// the phone's screen. The mouse moves the whole photo a little, for depth.
export function HeroStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.transform = `translate3d(${(-x * 22).toFixed(2)}px, ${(-y * 16).toFixed(2)}px, 0)`;
      frame = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="hero-stage-wrap">
      <div ref={ref} className="hero-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-mao.webp" alt="" width={2688} height={1504} fetchPriority="high" className="block h-full w-full select-none" draggable={false} />
        <div className="hero-screen" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
