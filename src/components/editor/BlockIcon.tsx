import type { BlockType } from "@/lib/page/schema";

// One drawn icon per block type, in the same stroke as the rest of the
// dashboard (no emoji).
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const PATHS: Record<BlockType, React.ReactNode> = {
  link: <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...P} />,
  heading: <path d="M5 5v14M15 5v14M5 12h10M19 19v-6l-2 1.5" {...P} />,
  text: <path d="M4 6h16M4 11h16M4 16h10" {...P} />,
  youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4" {...P} /><path d="m10 9.5 5 2.5-5 2.5z" {...P} /></>,
  spotify: <><circle cx="12" cy="12" r="9" {...P} /><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5.2-.4 7.2.8M8.6 15.4c1.9-.5 3.8-.3 5.3.6" {...P} /></>,
  faq: <><circle cx="12" cy="12" r="9" {...P} /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01" {...P} /></>,
  countdown: <><circle cx="12" cy="13" r="8" {...P} /><path d="M12 9v4l2.5 2M9 2.5h6" {...P} /></>,
  subscribe: <><rect x="3" y="5" width="18" height="14" rx="2" {...P} /><path d="m4 7 8 6 8-6" {...P} /></>,
  form: <><rect x="5" y="3" width="14" height="18" rx="2" {...P} /><path d="M9 8h6M9 12h6M9 16h4" {...P} /></>,
  whatsapp: <><path d="M3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 8 19.4z" {...P} /><path d="M9 9.5c.3 2 1.7 4 3.9 5l1.3-1.2 2 1" {...P} /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" {...P} /><circle cx="9" cy="10" r="1.8" {...P} /><path d="m21 16-5-5-9 9" {...P} /></>,
  product: <><path d="M5 8h14l-1.2 12H6.2z" {...P} /><path d="M9 8a3 3 0 0 1 6 0" {...P} /></>,
  map: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" {...P} /><circle cx="12" cy="9.5" r="2.5" {...P} /></>,
  contact: <><rect x="4" y="3" width="16" height="18" rx="2" {...P} /><circle cx="12" cy="10" r="2.5" {...P} /><path d="M8.5 17c.6-1.8 2-2.5 3.5-2.5s2.9.7 3.5 2.5" {...P} /></>,
  stats: <path d="M4 20V11M10 20V5M16 20v-7M21 20H3" {...P} />,
  gallery: <><rect x="3" y="3" width="8" height="8" rx="1.5" {...P} /><rect x="13" y="3" width="8" height="8" rx="1.5" {...P} /><rect x="3" y="13" width="8" height="8" rx="1.5" {...P} /><rect x="13" y="13" width="8" height="8" rx="1.5" {...P} /></>,
  videos: <><rect x="3" y="5" width="13" height="14" rx="2" {...P} /><path d="m16 10 5-3v10l-5-3" {...P} /></>,
  schedule: <><rect x="3" y="5" width="18" height="16" rx="2" {...P} /><path d="M3 10h18M8 3v4M16 3v4" {...P} /></>,
};

export function BlockIcon({ type, className = "h-[18px] w-[18px]" }: { type: BlockType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden>
      {PATHS[type]}
    </svg>
  );
}
