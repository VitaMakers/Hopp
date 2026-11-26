// The Virtú.bio signature under a page's footer: the logo and the name on a
// white pill, so it reads the same on light and dark models. `href` makes it a
// link (published pages); without it, it is plain (editor preview).
export function BrandSignature({ appName, href }: { appName: string; href?: string }) {
  const pill = (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,.12)] ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand-mark.png" alt="" className="h-[18px] w-auto" loading="lazy" />
      {appName}
    </span>
  );
  return (
    <div className="flex w-full justify-center">
      {href ? (
        <a href={href} target="_blank" rel="noopener" aria-label={`Feito com ${appName}`} className="transition hover:opacity-90">
          {pill}
        </a>
      ) : (
        pill
      )}
    </div>
  );
}
