"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Cover videos come straight from the phone's library and can be huge. The
// browser re-encodes them before upload: scaled down, silent (the cover plays
// muted anyway) and trimmed to a short loop, so the file that leaves the phone
// is a few MB instead of tens of MB. This keeps storage and mobile data low.
const MAX_INPUT_MB = 600; // reject only absurd files up front
const MAX_OUTPUT_MB = 25; // safety cap after re-encoding
const MAX_SIDE = 1280; // longest side in pixels
const MAX_SECONDS = 20; // a cover only needs a short loop
const BITRATE = 1_600_000; // ~1.6 Mbps: light and still sharp on a phone

// mp4 (H.264) plays on every phone, iPhone included, so it comes first; webm
// is the fallback on browsers that can't record mp4.
const TYPES = ["video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

type Processed = { blob: Blob; ext: "mp4" | "webm" };

// Re-encode in the browser. Returns null when the browser can't do it, so the
// caller can fall back to uploading a small original as-is.
async function processVideo(file: File, onProgress: (fraction: number) => void): Promise<Processed | null> {
  if (typeof MediaRecorder === "undefined") return null;
  const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported?.(t));
  if (!mimeType) return null;
  const ext: "mp4" | "webm" = mimeType.startsWith("video/mp4") ? "mp4" : "webm";

  const src = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0";
  document.body.appendChild(video);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("metadata"));
    });
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const scale = Math.min(1, MAX_SIDE / Math.max(vw, vh));
    const width = Math.max(2, Math.round((vw * scale) / 2) * 2);
    const height = Math.max(2, Math.round((vh * scale) / 2) * 2);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof canvas.captureStream !== "function") return null;

    const duration = Math.min(MAX_SECONDS, video.duration || MAX_SECONDS);
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const finished = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: ext === "mp4" ? "video/mp4" : "video/webm" }));
    });

    recorder.start(250);
    await video.play();
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (video.ended || video.currentTime >= duration) {
          resolve();
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        onProgress(Math.min(0.98, video.currentTime / duration));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    video.pause();
    recorder.stop();
    const blob = await finished;
    onProgress(1);
    return blob.size ? { blob, ext } : null;
  } finally {
    video.remove();
    URL.revokeObjectURL(src);
  }
}

export function useVideoUpload(onUploaded: (url: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handle(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setError(`Vídeo muito grande (máx. ${MAX_INPUT_MB}MB).`);
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      let upload: Processed | null = null;
      try {
        upload = await processVideo(file, setProgress);
      } catch {
        upload = null;
      }
      // Browser couldn't re-encode: accept a small original if it's already a
      // web video; otherwise ask for a lighter clip.
      if (!upload) {
        const okType = /mp4|webm/.test(file.type);
        if (okType && file.size <= MAX_OUTPUT_MB * 1024 * 1024) {
          upload = { blob: file, ext: file.type.includes("webm") ? "webm" : "mp4" };
        } else {
          setError("Não foi possível preparar o vídeo neste aparelho. Tente um vídeo mais curto, ou envie pelo celular.");
          return;
        }
      }
      if (upload.blob.size > MAX_OUTPUT_MB * 1024 * 1024) {
        setError("O vídeo ficou pesado demais. Use um trecho mais curto.");
        return;
      }
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("no-session");
      const contentType = upload.ext === "mp4" ? "video/mp4" : "video/webm";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${upload.ext}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, upload.blob, { contentType, upsert: true, cacheControl: "31536000" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch {
      setError("Não foi possível enviar. Tente de novo ou use um vídeo menor.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return { inputRef, busy, progress, error, open: () => inputRef.current?.click(), handle };
}

export function VideoUploadButton({ onUploaded, label = "Enviar vídeo da biblioteca" }: { onUploaded: (url: string) => void; label?: string }) {
  const { inputRef, busy, progress, error, open, handle } = useVideoUpload(onUploaded);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex h-9 items-center gap-2 self-start rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition-colors hover:border-stone-400 hover:bg-[#F3F2EE] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-stone-600" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="13" height="14" rx="2" />
          <path d="M16 10l5-3v10l-5-3" />
        </svg>
        {busy ? `Preparando... ${Math.round(progress * 100)}%` : label}
      </button>
      <input ref={inputRef} type="file" accept="video/*" className="sr-only" onChange={handle} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
