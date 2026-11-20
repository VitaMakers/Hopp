"use client";

import { useEffect, useState } from "react";

// A small live banner: shows how many distinct visitors were active in the
// last 5 minutes, refreshing on its own every 15 seconds.
export function LiveVisitors({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/analytics/live", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { count?: number };
        if (alive) setCount(data.count ?? 0);
      } catch {
        /* keep the last value on a transient error */
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const active = count > 0;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] border border-[#E5E2DA] bg-white px-5 py-3.5" aria-live="polite">
      <p className="flex items-center gap-2.5 text-[15px] font-medium">
        <span className="relative flex h-2.5 w-2.5">
          {active ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2F9E4F] opacity-60" /> : null}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${active ? "bg-[#2F9E4F]" : "bg-[#B9B6C9]"}`} />
        </span>
        {count.toLocaleString("pt-BR")} {count === 1 ? "visitante online" : "visitantes online"}
      </p>
      <p className="border-[#E5E2DA] text-sm text-stone-600 sm:border-l sm:pl-4">
        {active ? "Pessoas com a sua página aberta nos últimos 5 minutos." : "Quando alguém estiver na sua página, aparece aqui em tempo real."}
      </p>
    </div>
  );
}
