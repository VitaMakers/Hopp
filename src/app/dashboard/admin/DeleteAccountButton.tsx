"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteClientAccount } from "./actions";

// Admin-only: removes a whole account. Asks to type the page address so a
// stray click can never delete someone.
export function DeleteAccountButton({ accountId, handle, name, pages }: { accountId: string; handle: string; name: string; pages: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const close = () => {
    if (pending) return;
    setOpen(false);
    setTyped("");
    setError("");
  };
  const matches = typed.trim().replace(/^\//, "").toLowerCase() === handle.toLowerCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
      >
        Excluir
      </button>
      <dialog
        ref={dialog}
        onClose={close}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl p-0 text-left backdrop:bg-stone-900/50"
      >
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!matches) return;
            start(async () => {
              const res = await deleteClientAccount(accountId, typed);
              if (res.error) setError(res.error);
              else setOpen(false);
            });
          }}
        >
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Excluir a conta de {name}?</h3>
            <p className="mt-1 text-sm text-stone-600">
              Apaga o login e {pages > 1 ? <strong>as {pages} páginas desta conta</strong> : <strong>a página /{handle}</strong>}, com estatísticas,
              contatos e formulários. Se houver assinatura, ela é cancelada no Stripe. <strong>Não dá para desfazer.</strong>
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm text-stone-600">
            <span>
              Digite <strong className="text-stone-900">{handle}</strong> para confirmar
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="field"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={handle}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} disabled={pending} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!matches || pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              {pending ? "Excluindo..." : "Excluir conta"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
