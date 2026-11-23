"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Phone photos are often 8–15MB. We accept large originals and shrink them in
// the browser before upload, so uploads rarely fail and pages stay light.
const MAX_INPUT_MB = 50; // reject truly huge files up front
const MAX_OUTPUT_MB = 12; // after compression
const MAX_DIM = 1600; // longest side, in pixels: sharp on any phone, light on mobile data

const encode = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

// Whether any pixel is see-through (a logo on a transparent background).
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  } catch {
    return true; // can't read the pixels: keep transparency to be safe
  }
  return false;
}

// Downscale and re-encode an image as WebP, which keeps transparency and is
// a fraction of the size of a PNG or JPEG. Browsers that can't write WebP
// get a JPEG instead (or a PNG, only when the image really is transparent).
// Vector and animated formats pass through; so does anything we can't shrink.
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

  let blob = await encode(canvas, "image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") {
    const keepAlpha = type !== "image/jpeg" && hasTransparency(ctx, width, height);
    blob = await encode(canvas, keepAlpha ? "image/png" : "image/jpeg", keepAlpha ? undefined : 0.85);
  }
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
      const ext = mime.includes("webp")
        ? "webp"
        : mime.includes("png")
        ? "png"
        : mime.includes("jpeg") || mime.includes("jpg")
          ? "jpg"
          : (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, blob, { contentType: mime, upsert: true, cacheControl: "31536000" });
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
        className="group inline-flex h-10 items-center gap-2.5 self-start rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 text-[13px] font-semibold text-stone-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-stone-500 ring-1 ring-stone-200 transition-colors group-hover:bg-blue-500 group-hover:text-white group-hover:ring-blue-500">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 13v8M8 17l4-4 4 4" />
            <path d="M20 16.5A4.5 4.5 0 0 0 17 8h-1.26A7 7 0 1 0 4 14.5" />
          </svg>
        </span>
        {busy ? "Enviando..." : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handle} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
