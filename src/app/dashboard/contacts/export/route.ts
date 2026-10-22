import { toCsv } from "@/lib/csv";
import { getOwner } from "../../context";

export async function GET() {
  const { supabase, profile } = await getOwner();
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("email, phone, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) return new Response("Erro ao exportar", { status: 500 });

  const csv = toCsv(
    ["email", "whatsapp", "data"],
    (contacts ?? []).map((c) => [c.email ?? "", c.phone ?? "", c.created_at]),
  );
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="contatos.csv"',
    },
  });
}
