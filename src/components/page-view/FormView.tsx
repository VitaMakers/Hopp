"use client";

import { useState, type FormEvent } from "react";
import { imageSrc, whatsappHref } from "@/lib/page/links";
import type { Block } from "@/lib/page/schema";

type FormConfig = Extract<Block, { type: "form" }>;

// A standalone form on its own page (/f/[code]), styled to match the reference
// layout: narrow white card on light grey, logo on top, left-aligned grey
// labels with a leading asterisk, inline choice options, generous spacing.
export function FormView({ config, code }: { config: FormConfig; code: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers = config.fields.map((f, i) => {
      const name = `f${i}`;
      const value =
        f.type === "checkbox"
          ? data.getAll(name).map(String).filter(Boolean).join(", ")
          : String(data.get(name) ?? "").trim();
      return { label: f.label || `Campo ${i + 1}`, value };
    });

    setState("sending");
    fetch("/api/form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, answers }),
    }).catch(() => null);

    const lines = answers.filter((a) => a.value).map((a) => `*${a.label}:* ${a.value}`);
    const message = [config.title, ...lines].filter(Boolean).join("\n");
    const href = whatsappHref(config.whatsapp, message);
    if (href) window.open(href, "_blank", "noopener");

    setState("done");
  }

  const input =
    "w-full rounded-md border border-stone-200 bg-white px-3.5 py-2.5 text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400";
  const logo = imageSrc(config.logoUrl);

  return (
    <main className="min-h-screen bg-[#f2f2f2] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white px-6 py-9 shadow-sm sm:px-10">
        {state === "done" ? (
          <p className="py-8 text-center text-lg font-medium text-stone-800">{config.thankYouMessage}</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="mx-auto mb-3 max-h-28 w-auto object-contain" />
            ) : null}
            {config.title ? <h1 className="text-base font-semibold text-stone-900">{config.title}</h1> : null}
            {config.intro ? <p className="-mt-3 text-sm text-stone-500">{config.intro}</p> : null}
            {config.fields.map((f, i) => {
              const name = `f${i}`;
              const field =
                f.type === "textarea" ? (
                  <textarea name={name} required={f.required} rows={3} placeholder={f.placeholder} className={input} />
                ) : f.type === "select" ? (
                  <select name={name} required={f.required} defaultValue="" className={input}>
                    <option value="" disabled>
                      {f.placeholder || "Selecione..."}
                    </option>
                    {f.options.map((o, oi) => (
                      <option key={oi} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "radio" ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 pt-0.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="radio" name={name} value={o} required={f.required} />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : f.type === "checkbox" ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 pt-0.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="checkbox" name={name} value={o} />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    name={name}
                    required={f.required}
                    placeholder={f.placeholder}
                    type={
                      f.type === "email"
                        ? "email"
                        : f.type === "phone"
                          ? "tel"
                          : f.type === "number"
                            ? "number"
                            : f.type === "date"
                              ? "date"
                              : "text"
                    }
                    className={input}
                  />
                );
              const title = (
                <span className="text-[13px] text-stone-500">
                  {f.required ? <span>* </span> : null}
                  {f.label}
                </span>
              );
              return f.type === "radio" || f.type === "checkbox" ? (
                <div key={i} className="flex flex-col gap-1.5">
                  {title}
                  {field}
                </div>
              ) : (
                <label key={i} className="flex flex-col gap-1.5">
                  {title}
                  {field}
                </label>
              );
            })}
            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-2 rounded-md bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50"
            >
              {state === "sending" ? "Enviando..." : config.buttonText || "Enviar"}
            </button>
            <p className="text-center text-[11px] text-stone-400">
              Ao enviar, você concorda com a{" "}
              <a href="/privacidade" target="_blank" rel="noreferrer" className="underline">
                Política de Privacidade
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
