"use client";

import { useEffect, useState } from "react";
import { PageView } from "@/components/page-view/PageView";
import type { PageDoc } from "@/lib/page/schema";

// The models that take turns on the hero phone. Only the first one is in the
// page as it arrives; the others are added once the browser is idle, so their
// photos don't compete with the first paint. Each later model starts its turn
// as if it had been there from the beginning (the lag is subtracted from its
// animation delay), so the sequence keeps its rhythm.
export function HeroModels({ docs }: { docs: PageDoc[] }) {
  const [lag, setLag] = useState<number | null>(null);

  useEffect(() => {
    const started = performance.now();
    const show = () => setLag((performance.now() - started) / 1000);
    const idle = window.requestIdleCallback?.(show, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(show, 2500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {docs.map((doc, i) =>
        i === 0 || lag !== null ? (
          <div
            key={i}
            className="hero-cycle"
            style={{ "--i": i, "--n": docs.length, "--lag": i === 0 ? "0s" : `${(lag ?? 0).toFixed(2)}s` } as React.CSSProperties}
          >
            <div style={{ width: 390 }} className="pointer-events-none">
              <PageView doc={doc} still />
            </div>
          </div>
        ) : null,
      )}
    </>
  );
}
