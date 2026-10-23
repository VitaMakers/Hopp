// The blue "verified" check shown next to the name. A Profissional-only perk;
// which pages may show it is decided before render (stripped on publish for
// other plans), so this component just draws the mark.
export function VerifiedCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} role="img" aria-label="Verificado">
      <path
        fill="#1d9bf0"
        d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z"
      />
      <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8" />
    </svg>
  );
}
