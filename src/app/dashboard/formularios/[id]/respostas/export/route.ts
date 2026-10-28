import { toCsv } from "@/lib/csv";
import { formBlockSchema } from "@/lib/page/schema";
import { getOwner } from "../../../../context";

type Answer = { label: string; value: string };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getOwner();

  const { data: form } = await supabase.from("forms").select("config").eq("id", id).maybeSingle();
  if (!form) return new Response("Não encontrado", { status: 404 });
  const parsed = formBlockSchema.safeParse(form.config);
  const columns = parsed.success ? parsed.data.fields.map((f, i) => f.label || `Campo ${i + 1}`) : [];

  const { data: responses, error } = await supabase
    .from("form_responses")
    .select("answers, created_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new Response("Erro ao exportar", { status: 500 });

  const rows = (responses ?? []).map((r) => {
    const map = new Map((Array.isArray(r.answers) ? (r.answers as Answer[]) : []).map((a) => [a.label, a.value]));
    return [r.created_at, ...columns.map((c) => map.get(c) ?? "")];
  });

  const csv = toCsv(["Data", ...columns], rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="respostas.csv"',
    },
  });
}
