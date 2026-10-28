"use client";

import { deleteForm } from "./actions";

export function DeleteFormButton({ id }: { id: string }) {
  return (
    <form
      action={deleteForm.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm("Excluir este formulário e todas as respostas? Não dá para desfazer.")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-stone-400 transition hover:text-red-600 hover:underline">
        Excluir
      </button>
    </form>
  );
}
