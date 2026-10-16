"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Block, PageDoc } from "@/lib/page/schema";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { spotifyEmbedUrl, youtubeEmbedUrl } from "@/lib/page/embed";
import { linkHref, socialHref } from "@/lib/page/links";
import { buttonClass, themeVars } from "./theme";

type Props = {
  doc: PageDoc;
  // Set on the published page; omitted in the editor preview, which then
  // neither records analytics nor submits forms.
  handle?: string;
  footer?: React.ReactNode;
};

function track(handle: string | undefined, body: Record<string, string>) {
  if (!handle) return;
  const payload = JSON.stringify({ handle, ...body });
  if (!navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/track", { method: "POST", body: payload, keepalive: true });
  }
}

export function PageView({ doc, handle, footer }: Props) {
  const { profile, theme } = doc;
  const blocks = doc.blocks.filter((block) => block.enabled);

  useEffect(() => {
    track(handle, { kind: "page_view", referrer: document.referrer });
  }, [handle]);

  return (
    <div style={themeVars(theme)} className="min-h-full bg-[var(--page-bg)] text-[var(--page-text)]">
      {theme.layout === "cover" && profile.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.coverUrl} alt="" className="h-44 w-full object-cover" />
      ) : null}
      <main
        className={`mx-auto flex w-full max-w-[580px] flex-col items-center px-5 pb-10 ${
          theme.layout === "cover" && profile.coverUrl ? "-mt-14" : "pt-12"
        }`}
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="h-24 w-24 rounded-full border-4 border-[var(--page-bg)] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--btn-bg)] text-3xl font-semibold text-[var(--btn-text)]">
            {profile.name.trim().charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <h1 className="mt-4 text-center text-xl font-bold">{profile.name}</h1>
        {profile.bio ? (
          <p className="mt-2 max-w-md whitespace-pre-line text-center text-[15px] opacity-80">
            {profile.bio}
          </p>
        ) : null}

        <Socials doc={doc} handle={handle} />

        <div className="mt-7 flex w-full flex-col gap-3.5">
          {blocks.map((block) => (
            <BlockView key={block.id} block={block} doc={doc} handle={handle} />
          ))}
        </div>
        {footer}
      </main>
    </div>
  );
}

function Socials({ doc, handle }: { doc: PageDoc; handle?: string }) {
  const links = doc.socials
    .map((social) => ({ social, href: socialHref(social) }))
    .filter((item): item is { social: (typeof doc.socials)[number]; href: string } => !!item.href);
  if (links.length === 0) return null;
  return (
    <nav className="mt-4 flex flex-wrap justify-center gap-2">
      {links.map(({ social, href }) => (
        <a
          key={`${social.platform}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(handle, { kind: "social_click", target: social.platform })}
          className="rounded-full border border-current/25 px-3 py-1 text-sm opacity-85 hover:opacity-100"
        >
          {SOCIAL_LABELS[social.platform]}
        </a>
      ))}
    </nav>
  );
}

function BlockView({ block, doc, handle }: { block: Block; doc: PageDoc; handle?: string }) {
  const btn = buttonClass(doc.theme.buttonStyle);
  switch (block.type) {
    case "link": {
      const href = linkHref(block.url);
      if (!href) {
        // In the editor preview, show it dimmed so a new link doesn't vanish
        // before its address is filled in. Visitors never see it.
        return handle ? null : <span className={`${btn} opacity-40`}>{block.title || "Link sem endereço"}</span>;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          onClick={() => track(handle, { kind: "block_click", blockId: block.id, target: href })}
        >
          {block.title || href}
        </a>
      );
    }
    case "heading":
      return <h2 className="mt-3 text-center text-base font-semibold">{block.text}</h2>;
    case "text":
      return <p className="whitespace-pre-line text-center text-[15px] opacity-85">{block.text}</p>;
    case "youtube": {
      const src = youtubeEmbedUrl(block.url);
      if (!src) return null;
      return (
        <iframe
          src={src}
          title="Vídeo do YouTube"
          className="aspect-video w-full rounded-[var(--btn-radius)]"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      );
    }
    case "spotify": {
      const src = spotifyEmbedUrl(block.url);
      if (!src) return null;
      return (
        <iframe
          src={src}
          title="Spotify"
          className="h-[152px] w-full rounded-xl"
          allow="encrypted-media"
          loading="lazy"
        />
      );
    }
    case "faq":
      return (
        <section className="w-full">
          {block.title ? <h2 className="mb-2 text-center font-semibold">{block.title}</h2> : null}
          <div className="flex flex-col gap-2">
            {block.items.map((item, index) => (
              <details
                key={index}
                className="rounded-[var(--btn-radius)] bg-[color-mix(in_srgb,var(--page-text)_7%,transparent)] px-4 py-3"
              >
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 whitespace-pre-line text-[15px] opacity-85">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "countdown":
      return <Countdown title={block.title} endsAt={block.endsAt} />;
    case "subscribe":
      return <SubscribeForm block={block} handle={handle} buttonClassName={btn} />;
  }
}

function Countdown({ title, endsAt }: { title: string; endsAt: string }) {
  // Rendered empty on the server and filled after mount, so the server's
  // clock never mismatches the visitor's during hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return null;
  const left = now === null ? null : Math.max(0, end - now);
  const parts =
    left === null
      ? null
      : [
          ["dias", Math.floor(left / 86_400_000)],
          ["horas", Math.floor(left / 3_600_000) % 24],
          ["min", Math.floor(left / 60_000) % 60],
          ["seg", Math.floor(left / 1000) % 60],
        ];
  return (
    <section className="w-full rounded-[var(--btn-radius)] bg-[color-mix(in_srgb,var(--page-text)_7%,transparent)] p-4 text-center">
      <p className="font-medium">{title}</p>
      <div className="mt-2 flex justify-center gap-4 tabular-nums">
        {(parts ?? []).map(([label, value]) => (
          <div key={label}>
            <div className="text-2xl font-bold">{String(value).padStart(2, "0")}</div>
            <div className="text-xs opacity-70">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscribeForm({
  block,
  handle,
  buttonClassName,
}: {
  block: Extract<Block, { type: "subscribe" }>;
  handle?: string;
  buttonClassName: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!handle) return;
    const form = new FormData(event.currentTarget);
    setState("sending");
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        handle,
        blockId: block.id,
        email: form.get("email") ?? "",
        phone: form.get("phone") ?? "",
      }),
    }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  const input =
    "w-full rounded-[var(--btn-radius)] border border-current/25 bg-transparent px-4 py-3 outline-none focus:border-current/60";

  if (state === "done") {
    return <p className="rounded-[var(--btn-radius)] p-4 text-center font-medium">{block.thankYouMessage}</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2.5">
      <p className="text-center font-semibold">{block.title}</p>
      <input name="email" type="email" required placeholder="Seu e-mail" className={input} />
      {block.collectPhone ? (
        <input name="phone" type="tel" placeholder="Seu WhatsApp (opcional)" className={input} />
      ) : null}
      <button type="submit" disabled={state === "sending"} className={buttonClassName}>
        {state === "sending" ? "Enviando..." : block.buttonText}
      </button>
      {state === "error" ? <p className="text-center text-sm">Não deu certo. Tente de novo.</p> : null}
    </form>
  );
}
