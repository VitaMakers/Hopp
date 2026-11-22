// Placeholder blocks shown while a screen's data is loading, in place of a
// blank white page. Pure CSS shimmer (no JS), so it costs nothing to render.
// Used only inside the dashboard — never on a client's published page.

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-stone-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

// A full-screen dashboard placeholder: a title line, a couple of action chips
// and a grid of cards, matching the real screens' rough shape.
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
