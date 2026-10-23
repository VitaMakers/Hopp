"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_MB = 5;

// Uploads an image to Supabase Storage and returns its public URL. Files go in
// the signed-in account's own folder (uploads/<auth uid>/...).
export function UploadButton({ onUploaded, label = "Enviar imagem" }: { onUploaded: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`Imagem muito grande (máx. ${MAX_MB}MB).`);
      } else {
        setBusy(true);
        try {
          const supabase = createClient();
          const { data: auth } = await supabase.auth.getUser();
          if (!auth.user) throw new Error("no-session");
          const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: true });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from("uploads").getPublicUrl(path);
          onUploaded(data.publicUrl);
        } catch {
          setError("Não foi possível enviar. Tente novamente ou use uma imagem menor.");
        } finally {
          setBusy(false);
        }
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="self-start rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-900 disabled:opacity-50"
      >
        {busy ? "Enviando..." : `⬆ ${label}`}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handle} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
