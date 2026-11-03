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
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <span className="relative flex h-3 w-3">
        {active ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /> : null}
        <span className={`relative inline-flex h-3 w-3 rounded-full ${active ? "bg-emerald-500" : "bg-stone-300"}`} />
      </span>
      <div>
        <p className="text-sm font-semibold">
          {active ? (
            <>
              {count.toLocaleString("pt-BR")} {count === 1 ? "visitante agora" : "visitantes agora"}
            </>
          ) : (
            "Nenhum visitante agora"
          )}
        </p>
        <p className="text-xs text-stone-500">Nos últimos 5 minutos · atualiza sozinho</p>
      </div>
    </div>
  );
}
