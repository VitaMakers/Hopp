"use client";

import { cancelClientSubscription } from "./actions";

export function CancelSubscriptionButton({ clientId }: { clientId: string }) {
  return (
    <form
      action={cancelClientSubscription.bind(null, clientId)}
      onSubmit={(e) => {
        if (!window.confirm("Cancelar a assinatura deste cliente? Ele volta para o plano Grátis.")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-xs text-stone-400 transition hover:text-red-600 hover:underline">
        Cancelar assinatura
      </button>
    </form>
  );
}
