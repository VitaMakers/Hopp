"use client";

import { useEffect, useState } from "react";

type TextProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
};

export function TextField({ label, value, onChange, placeholder, maxLength, type = "text" }: TextProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder, maxLength }: TextProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {label}
      <textarea
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      {title ? <h2 className="font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

// A list typed as text ("P, M, G" or one option per line). The raw text stays
// exactly as typed (spaces, a trailing comma, a new empty line), while the
// parsed list goes to the page on every keystroke so the preview stays live.
export function ListField({
  label,
  value,
  onChange,
  separator = ",",
  max,
  itemMax,
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  separator?: "," | "\n";
  max: number;
  itemMax?: number;
  multiline?: boolean;
  maxLength?: number;
}) {
  const joiner = separator === "," ? ", " : "\n";
  const parse = (text: string) =>
    text
      .split(separator)
      .map((item) => (itemMax ? item.trim().slice(0, itemMax) : item.trim()))
      .filter(Boolean)
      .slice(0, max);
  const [raw, setRaw] = useState(value.join(joiner));
  // Follow changes made elsewhere (e.g. applying a template), but never
  // rewrite what the person is typing when it already means the same list.
  const joined = value.join(joiner);
  useEffect(() => {
    setRaw((current) => (parse(current).join(joiner) === joined ? current : joined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);
  const update = (text: string) => {
    setRaw(text);
    onChange(parse(text));
  };
  return multiline ? (
    <TextArea label={label} value={raw} maxLength={maxLength} onChange={update} />
  ) : (
    <TextField label={label} value={raw} maxLength={maxLength} onChange={update} />
  );
}
