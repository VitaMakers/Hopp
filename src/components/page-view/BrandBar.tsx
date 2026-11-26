"use client";

import { useEffect, useState } from "react";

// The Virtú.bio buttons around a published page: the logo and a share button
// at the top, and a "create yours" pill at the bottom. They sit outside the
// page itself, so every model gets them the same way.
// `top` is off on models that already have their own bar at the top.
export function BrandBar({ appName, siteUrl, title, top = true }: { appName: string; siteUrl: string; title: string; top?: boolean }) {
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  // At the very end of the page the pill steps aside, so the last link and
  // the footer are never covered.
  const [atEnd, setAtEnd] = useState(false);
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // The landing page first, so a visitor learns what it is before signing up.
  const signup = siteUrl;

  useEffect(() => {
    try {
      if (sessionStorage.getItem("vb_pill") === "0") setClosed(true);
    } catch {}
  }, []);

  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setAtEnd(scrollable > 0 && window.scrollY >= scrollable - Math.min(48, scrollable / 2));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem("vb_pill", "0");
    } catch {}
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // The visitor closed the share sheet: nothing to do.
    }
  };

  const round =
    "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,.14)] ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-95";

  return (
    <>
      {top ? (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-auto flex max-w-[720px] items-start justify-end p-3">
        <button type="button" onClick={share} aria-label="Compartilhar esta página" className={`${round} relative`}>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
          </svg>
          {copied ? (
            <span role="status" className="absolute right-0 top-12 whitespace-nowrap rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
              Link copiado
            </span>
          ) : null}
        </button>
      </div>
      ) : null}

      {closed ? null : (
        <>
          <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-12 transition-[opacity,transform] duration-300 ${atEnd ? "translate-y-4 opacity-0 [&_*]:pointer-events-none" : ""}`}>
            <div className="pointer-events-auto relative flex items-center rounded-full bg-white text-stone-900 shadow-[0_6px_24px_rgba(0,0,0,.22)] ring-1 ring-black/5">
              <a href={signup} target="_blank" rel="noopener" className="px-12 py-2.5 text-center text-[15px] font-semibold">
                {host}
              </a>
              <button type="button" onClick={close} aria-label="Fechar" className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-stone-600 transition hover:text-stone-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <a href={signup} target="_blank" rel="noopener" className="pointer-events-auto text-[13px] font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
              Crie seu link
            </a>
          </div>
        </>
      )}
    </>
  );
}
