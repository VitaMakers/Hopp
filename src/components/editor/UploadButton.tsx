"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Phone photos are often 8–15MB. We accept large originals and shrink them in
// the browser before upload, so uploads rarely fail and pages stay light.
const MAX_INPUT_MB = 50; // reject truly huge files up front
const MAX_OUTPUT_MB = 12; // after compression
const MAX_DIM = 2000; // longest side, in pixels

// Downscale and re-encode an image. Keeps PNG (transparency) and skips vector
// or animated formats; falls back to the original if it can't do better.
async function processImage(file: File): Promise<Blob> {
  const type = file.type;
  if (type === "image/svg+xml" || type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const outType = type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, outType === "image/jpeg" ? 0.85 : undefined),
  );
  if (!blob) return file;
  // Only use the processed version if it's actually smaller.
  return blob.size < file.size ? blob : file;
}

// Shared image-upload logic: compresses in the browser, uploads to Supabase
// storage and returns the public URL. Reused by the button and the clickable
// avatar circle, so both behave exactly the same.
export function useImageUpload(onUploaded: (url: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setError(`Imagem muito grande (máx. ${MAX_INPUT_MB}MB).`);
      return;
    }
    setBusy(true);
    try {
      const blob = await processImage(file);
      if (blob.size > MAX_OUTPUT_MB * 1024 * 1024) {
        setError("Mesmo compactada a imagem ficou grande. Tente uma foto menor.");
        return;
      }
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("no-session");
      const mime = blob.type || file.type;
      const ext = mime.includes("png")
        ? "png"
        : mime.includes("jpeg") || mime.includes("jpg")
          ? "jpg"
          : (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, blob, { contentType: mime, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch {
      setError("Não foi possível enviar. Tente novamente ou use uma imagem menor.");
    } finally {
      setBusy(false);
    }
  }

  return { inputRef, busy, error, open: () => inputRef.current?.click(), handle };
}

export function UploadButton({ onUploaded, label = "Enviar imagem" }: { onUploaded: (url: string) => void; label?: string }) {
  const { inputRef, busy, error, open, handle } = useImageUpload(onUploaded);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex h-9 items-center gap-2 self-start rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition-colors hover:border-stone-400 hover:bg-[#F3F2EE] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-stone-600" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        </svg>
        {busy ? "Enviando..." : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handle} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
