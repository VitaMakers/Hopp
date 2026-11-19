"use client";

import { useFormStatus } from "react-dom";

// Delete with a confirmation, and disabled while it runs (no double clicks).
export function ConfirmDeleteButton({ action, message }: { action: () => Promise<void>; message: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-red-600 disabled:opacity-50">
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
