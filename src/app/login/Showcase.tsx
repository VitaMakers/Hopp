"use client";

import { useEffect, useRef } from "react";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import type { PageDoc } from "@/lib/page/schema";

// Three premium models standing in space: the middle one forward, the sides
// turned inward. Each floats slowly and the group leans a little toward the
// pointer. With reduced motion it is the same scene, standing still.
const POSES = [
  "translateX(2px) translateZ(-70px) rotateY(24deg)",
  "translateZ(50px)",
  "translateX(-2px) translateZ(-70px) rotateY(-24deg)",
];

export function Showcase({ models }: { models: { doc: PageDoc; label: string }[] }) {
  const group = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = group.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--lean-y", `${(x * 14).toFixed(2)}deg`);
        el.style.setProperty("--lean-x", `${(-y * 8).toFixed(2)}deg`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="flex origin-top justify-center [perspective:1300px]" style={{ transform: "scale(clamp(0.36, tan(atan2(calc(100vh - 430px), 490px)), 1))" }}>
      <div ref={group} className="login-lean flex items-start [transform-style:preserve-3d]">
        {models.map((m, i) => (
          <div key={m.label} className={`[transform-style:preserve-3d] ${i === 1 ? "z-10" : "mt-9"}`} style={{ transform: POSES[i] }}>
            <div className="login-float" style={{ animationDelay: `${-i * 1.7}s` }}>
              <div className="overflow-hidden rounded-[32px] border-[7px] border-[#12142B] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/20">
                <ModelThumb doc={m.doc} width={190} height={392} />
              </div>
              <p className="mt-3 text-center text-[13px] font-medium text-white/75">{m.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
