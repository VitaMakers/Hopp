"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { project, WORLD_BOX, type Box } from "./geo";

export type GeoCity = { city: string; cc: string; count: number; lat: number | null; lon: number | null };
export type GeoCountry = { cc: string; name: string; count: number; box: Box | null };

const PER_PAGE = 6;
const fmt = (n: number) => n.toLocaleString("pt-BR");

// What the map frames for a country: its outline plus some of the neighbours,
// widened to the panel's shape so the country sits in the middle.
function frame(box: Box | null): Box {
  if (!box) return WORLD_BOX;
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0;
  const h = y1 - y0;
  const pad = Math.max(w, h) * 0.22 + 2;
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}

// Sessions by place: the map with a dot per city on the left and, on the
// right, the countries and (inside one) its cities. Picking a country moves
// the map to it; pointing at a city lights up its dot, and the other way round.
export function GeoPanel({ countries, cities, children }: { countries: GeoCountry[]; cities: GeoCity[]; children: React.ReactNode }) {
  const [cc, setCc] = useState<string | null>(countries[0]?.cc ?? null);
  const [page, setPage] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const country = countries.find((c) => c.cc === cc) ?? null;

  const inCountry = useMemo(() => (cc ? cities.filter((c) => c.cc === cc) : []), [cities, cc]);
  const pages = Math.max(1, Math.ceil(inCountry.length / PER_PAGE));
  const shown = inCountry.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const maxCity = Math.max(1, ...inCountry.map((c) => c.count));
  const maxCountry = Math.max(1, ...countries.map((c) => c.count));

  // The map glides to the chosen country instead of jumping.
  const target = useMemo(() => frame(country?.box ?? null), [country]);
  const [view, setView] = useState<Box>(target);
  const from = useRef<Box>(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frameId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const e = 1 - Math.pow(1 - t, 3);
      const next = origin.map((v, i) => v + (target[i] - v) * e) as Box;
      setView(next);
      from.current = next;
      if (t < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  const width = view[2] - view[0];
  const height = view[3] - view[1];
  const unit = Math.max(width, height) / 100;

  const dots = (cc ? inCountry : cities)
    .filter((c): c is GeoCity & { lat: number; lon: number } => c.lat !== null && c.lon !== null)
    .map((c) => ({ ...c, key: `${c.city}|${c.cc}`, xy: project(c.lon, c.lat) }))
    .sort((a, b) => b.count - a.count);
  const maxDot = Math.max(1, ...dots.map((d) => d.count));

  function pick(next: string | null) {
    setCc(next);
    setPage(0);
    setHover(null);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-[12px] bg-[#F6F5F9]">
        <svg viewBox={`${view[0]} ${view[1]} ${width} ${height}`} className="block h-[320px] w-full sm:h-[380px]" role="img" aria-label="Mapa das sessões por local">
          <g fill="#E4E3EC" stroke="#FFFFFF" strokeWidth={unit * 0.28} strokeLinejoin="round">
            {children}
          </g>
          {dots.map((d) => {
            const on = hover === d.key;
            const r = unit * (0.7 + 2.1 * Math.sqrt(d.count / maxDot));
            return (
              <g key={d.key} onMouseEnter={() => setHover(d.key)} onMouseLeave={() => setHover(null)} className="cursor-default">
                <circle cx={d.xy[0]} cy={d.xy[1]} r={r * (on ? 1.9 : 1.5)} fill="#3A55F5" opacity={on ? 0.3 : 0.18} />
                <circle cx={d.xy[0]} cy={d.xy[1]} r={r} fill="#3A55F5" stroke="#FFFFFF" strokeWidth={unit * 0.22} />
                <title>{`${d.city}: ${fmt(d.count)}`}</title>
              </g>
            );
          })}
        </svg>
        {hover ? (
          <p className="pointer-events-none absolute left-3 top-3 rounded-[8px] bg-stone-900 px-2.5 py-1.5 text-xs font-semibold text-white">
            {hover.split("|")[0]} · {fmt(cities.find((c) => `${c.city}|${c.cc}` === hover)?.count ?? 0)}
          </p>
        ) : null}
        {cities.length > 0 && dots.length === 0 ? (
          <p className="absolute inset-x-3 bottom-3 rounded-[8px] bg-white/90 px-3 py-2 text-xs text-stone-700">
            Os pontos no mapa aparecem para as visitas recebidas a partir de agora.
          </p>
        ) : null}
      </div>

      <div className="min-w-0">
        {country ? (
          <>
            <button
              type="button"
              onClick={() => pick(null)}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-900"
              aria-label="Voltar para a lista de países"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[#E5E2DA] transition-colors hover:border-stone-400">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </span>
              {country.name}
            </button>
            {shown.length === 0 ? (
              <p className="text-sm text-stone-600">Sem cidade identificada neste país.</p>
            ) : (
              <ul className="flex flex-col gap-3.5">
                {shown.map((c) => {
                  const key = `${c.city}|${c.cc}`;
                  return (
                    <li key={key} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)} className="cursor-default">
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className={`truncate ${hover === key ? "font-semibold" : ""}`}>{c.city}</span>
                        <span className="font-semibold tabular-nums">{fmt(c.count)}</span>
                      </span>
                      <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#E9E8EF]">
                        <span className="block h-full rounded-full bg-blue-500 transition-[width] duration-300" style={{ width: `${Math.max(2, (c.count / maxCity) * 100)}%` }} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {pages > 1 ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                {([-1, 1] as const).map((dir) => {
                  const off = dir === -1 ? page === 0 : page >= pages - 1;
                  return (
                    <button
                      key={dir}
                      type="button"
                      disabled={off}
                      onClick={() => setPage((p) => p + dir)}
                      aria-label={dir === -1 ? "Cidades anteriores" : "Mais cidades"}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D9DDFD] text-blue-600 transition-colors hover:bg-[#EDEDF8] disabled:border-[#E5E2DA] disabled:bg-[#F3F2EE] disabled:text-stone-400"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={dir === -1 ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold">Países</p>
            <ul className="flex flex-col gap-3.5">
              {countries.map((c) => (
                <li key={c.cc}>
                  <button type="button" onClick={() => pick(c.cc)} className="group block w-full text-left">
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate group-hover:underline">{c.name}</span>
                      <span className="font-semibold tabular-nums">{fmt(c.count)}</span>
                    </span>
                    <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#E9E8EF]">
                      <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, (c.count / maxCountry) * 100)}%` }} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
