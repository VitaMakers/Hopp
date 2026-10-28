"use client";

import { useState, type FormEvent } from "react";
import { whatsappHref } from "@/lib/page/links";
import type { Block } from "@/lib/page/schema";

type FormConfig = Extract<Block, { type: "form" }>;

// A standalone form on its own page (/f/[code]). Submitting saves the response
// and opens WhatsApp with the answers pre-filled.
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
    "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-stone-900";

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        {state === "done" ? (
          <p className="py-8 text-center text-lg font-medium text-stone-800">{config.thankYouMessage}</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {config.title ? <h1 className="text-xl font-bold text-stone-900">{config.title}</h1> : null}
            {config.intro ? <p className="-mt-2 text-sm text-stone-600">{config.intro}</p> : null}
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
                  <div className="flex flex-col gap-1.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-2 text-sm font-normal text-stone-700">
                        <input type="radio" name={name} value={o} required={f.required} />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : f.type === "checkbox" ? (
                  <div className="flex flex-col gap-1.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-2 text-sm font-normal text-stone-700">
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
                <span className="text-sm font-medium text-stone-700">
                  {f.label}
                  {f.required ? " *" : ""}
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
              className="mt-2 rounded-lg bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50"
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
