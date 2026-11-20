"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Card = { id: string; label: string; node: React.ReactNode };

const SPACING = 430; // distance between one model and the next, into the screen
const START = -2100; // where the first model sits before any scrolling
const FOCAL = 1000; // must match the CSS perspective

// A scroll-driven 3D corridor: the title stays in the middle while the models
// fly from the back of the screen past the camera. Moving the mouse shifts the
// vanishing point a little, so the corridor feels deep.
export function Tunnel({ cards, children }: { cards: Card[]; children: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    const st = stage.current;
    if (!el || !st) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(st.querySelectorAll<HTMLElement>("[data-card]"));
    const rings = Array.from(st.querySelectorAll<HTMLElement>("[data-ring]"));
    const title = st.querySelector<HTMLElement>("[data-title]");
    const hint = st.querySelector<HTMLElement>("[data-hint]");
    const cta = st.querySelector<HTMLElement>("[data-cta]");
    const travel = -START + (items.length - 1) * SPACING + 950;

    let frame = 0;
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;

    const draw = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - vh)));
      const w = st.clientWidth;
      const h = st.clientHeight;
      const small = w < 640;
      const radius = Math.min(w, h) * (small ? 0.42 : 0.36);

      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      st.style.perspectiveOrigin = `${50 + cx * 6}% ${50 + cy * 6}%`;

      items.forEach((card, i) => {
        const z = START - i * SPACING + p * travel;
        const angle = (i * 137.5 * Math.PI) / 180 - 0.6;
        const x = Math.cos(angle) * radius * (small ? 0.95 : 1.35);
        const y = Math.sin(angle) * radius * (small ? 1.15 : 0.8);
        const far = Math.min(1, Math.max(0, (z + 2700) / 900));
        const near = Math.min(1, Math.max(0, (FOCAL - 180 - z) / 380));
        const opacity = far * near;
        card.style.opacity = opacity.toFixed(3);
        card.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(-Math.cos(angle) * 16).toFixed(1)}deg) rotateZ(${(Math.sin(i * 2.1) * 7).toFixed(1)}deg)`;
      });

      rings.forEach((ring, i) => {
        const t = (i / rings.length + p * 2.4) % 1;
        ring.style.transform = `translate(-50%, -50%) scale(${(0.18 + t * t * 2.6).toFixed(3)})`;
        ring.style.opacity = (Math.sin(t * Math.PI) * 0.55).toFixed(3);
      });

      if (title) title.style.transform = `scale(${(1 + p * 0.06).toFixed(4)})`;
      if (hint) hint.style.opacity = Math.max(0, 1 - p * 14).toFixed(3);
      if (cta) {
        const show = Math.min(1, Math.max(0, (p - 0.86) / 0.1));
        cta.style.opacity = show.toFixed(3);
        cta.style.transform = `translateY(${((1 - show) * 14).toFixed(1)}px)`;
        cta.style.pointerEvents = show > 0.5 ? "auto" : "none";
      }

      if (Math.abs(mx - cx) > 0.002 || Math.abs(my - cy) > 0.002) frame = requestAnimationFrame(draw);
    };

    // Work only while the section is on (or near) the screen.
    let near = true;
    const schedule = () => {
      if (near && !frame) frame = requestAnimationFrame(draw);
    };
    const watcher = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) schedule();
      },
      { rootMargin: "200px 0px" },
    );
    watcher.observe(el);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      schedule();
    };

    st.dataset.live = "1";
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <section ref={section} id="modelos" className="tunnel relative" style={{ height: `${Math.round(120 + cards.length * 34)}vh` }}>
      <div ref={stage} className="tunnel-stage sticky top-0 h-[100svh] overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,rgba(58,85,245,0.34),rgba(36,30,110,0.16)_45%,transparent_72%)]" />
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} data-ring className="tunnel-ring" />
        ))}

        <div className="tunnel-cards absolute inset-0 [transform-style:preserve-3d]">
          {cards.map((card) => (
            <div key={card.id} data-card className="tunnel-card">
              <div className="tunnel-thumb">{card.node}</div>
              <span className="tunnel-label">{card.label}</span>
            </div>
          ))}
        </div>

        <div data-title className="tunnel-title pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {children}
        </div>

        <p data-hint className="tunnel-hint absolute inset-x-0 bottom-8 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-white/55">
          Role para explorar
        </p>
        <div data-cta className="tunnel-cta absolute inset-x-0 bottom-[12vh] flex justify-center opacity-0">
          <Link href="/login?criar" className="inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-semibold text-[#0b0c20] transition-transform hover:scale-[1.03]">
            Começar com um modelo
          </Link>
        </div>
      </div>
    </section>
  );
}
