"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { youtubeEmbedUrl } from "@/lib/page/embed";
import { imageSrc, whatsappHref } from "@/lib/page/links";
import { FORM_DISPLAY_TYPES, type Block } from "@/lib/page/schema";
import { DateField } from "./DateField";

type FormConfig = Extract<Block, { type: "form" }>;
const isDisplay = (t: string) => (FORM_DISPLAY_TYPES as readonly string[]).includes(t);

export function FormView({ config, code }: { config: FormConfig; code: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const viewed = useRef(false);

  // Count the open once per load.
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    fetch("/api/form-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
  }, [code]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers = config.fields
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => !isDisplay(f.type))
      .map(({ f, i }) => {
        const name = `f${i}`;
        const other = String(data.get(`${name}_other`) ?? "").trim();
        let value: string;
        if (f.type === "checkbox") {
          const vals = data.getAll(name).map(String).filter(Boolean);
          const oi = vals.indexOf("__other__");
          if (oi >= 0) {
            if (other) vals[oi] = other;
            else vals.splice(oi, 1);
          }
          value = vals.join(", ");
        } else if (f.type === "radio") {
          let v = String(data.get(name) ?? "").trim();
          if (v === "__other__") v = other;
          value = v;
        } else if (f.type === "date") {
          const d = String(data.get(name) ?? "").trim();
          const t = String(data.get(`${name}_time`) ?? "").trim();
          value = [d, t].filter(Boolean).join(" ");
        } else {
          value = String(data.get(name) ?? "").trim();
        }
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
              // Display-only blocks: no input, no label row.
              if (f.type === "header") {
                return (
                  <h2 key={i} className="text-base font-bold text-stone-900">
                    {f.label}
                  </h2>
                );
              }
              if (f.type === "image") {
                const m = imageSrc(f.mediaUrl);
                // eslint-disable-next-line @next/next/no-img-element
                return m ? <img key={i} src={m} alt={f.label} className="w-full rounded-md" /> : null;
              }
              if (f.type === "video") {
                const e = youtubeEmbedUrl(f.mediaUrl);
                return e ? (
                  <div key={i} className="aspect-video w-full overflow-hidden rounded-md">
                    <iframe src={e} title={f.label} allowFullScreen className="h-full w-full border-0" />
                  </div>
                ) : null;
              }

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
                ) : f.type === "rating" ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="cursor-pointer text-2xl leading-none text-stone-300 transition has-[:checked]:text-amber-400">
                        <input type="radio" name={name} value={n} required={f.required} className="sr-only" />★
                      </label>
                    ))}
                  </div>
                ) : f.type === "date" ? (
                  <DateField name={name} required={f.required} datetime={f.datePickerMode === "datetime"} />
                ) : f.type === "radio" ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-0.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="radio" name={name} value={o} required={f.required} />
                        {o}
                      </label>
                    ))}
                    {f.allowOther ? (
                      <label className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="radio" name={name} value="__other__" required={f.required} />
                        Outro:
                        <input type="text" name={`${name}_other`} className="w-32 rounded border border-stone-200 px-2 py-0.5 text-sm" />
                      </label>
                    ) : null}
                  </div>
                ) : f.type === "checkbox" ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-0.5">
                    {f.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="checkbox" name={name} value={o} />
                        {o}
                      </label>
                    ))}
                    {f.allowOther ? (
                      <label className="flex items-center gap-1.5 text-sm text-stone-700">
                        <input type="checkbox" name={name} value="__other__" />
                        Outro:
                        <input type="text" name={`${name}_other`} className="w-32 rounded border border-stone-200 px-2 py-0.5 text-sm" />
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <input
                    name={name}
                    required={f.required}
                    placeholder={f.placeholder}
                    type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "number" ? "number" : "text"}
                    className={input}
                  />
                );
              const title = (
                <span className="flex flex-col">
                  <span className="text-[13px] text-stone-500">
                    {f.required ? <span className="text-red-500">* </span> : null}
                    {f.label}
                  </span>
                  {f.description ? <span className="text-[11px] text-stone-400">{f.description}</span> : null}
                </span>
              );
              return f.type === "radio" || f.type === "checkbox" || f.type === "rating" || f.type === "date" ? (
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
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:bg-[#1ebe5a] disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.517 5.248l-.999 3.648 3.971-1.595zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
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
