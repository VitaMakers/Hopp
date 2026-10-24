import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/env";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como o ${APP_NAME} coleta, usa e protege dados pessoais, de acordo com a LGPD.`,
};

const CONTACT = "contato@vitamakers.com.br";
const UPDATED = "24 de outubro de 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-stone-500">Última atualização: {UPDATED}</p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-stone-700">
        <p>
          Esta Política explica como o <strong>{APP_NAME}</strong> trata dados pessoais, de acordo com a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018 — LGPD). Ao usar o serviço ou enviar seus dados em uma página criada
          nele, você concorda com as práticas descritas aqui.
        </p>

        <Section title="1. Quem é o responsável">
          O {APP_NAME} é operado pela Vita Makers. Para qualquer assunto relacionado a dados pessoais, fale com a gente
          pelo e-mail <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </Section>

        <Section title="2. Dados que coletamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>De quem cria uma página:</strong> e-mail e senha da conta, nome/endereço da página e o conteúdo
              que você adiciona (textos, imagens, links).
            </li>
            <li>
              <strong>De quem visita uma página:</strong> dados de navegação para estatísticas (visitas e cliques, de
              forma agregada) e, quando você preenche um formulário de contato, o e-mail e/ou telefone que você informar.
            </li>
            <li>
              <strong>Pagamentos:</strong> quando há assinatura ou venda, os dados de pagamento são tratados diretamente
              pela Stripe; não armazenamos números de cartão.
            </li>
          </ul>
        </Section>

        <Section title="3. Para que usamos">
          Operar e melhorar o serviço, gerar estatísticas para o dono da página, processar pagamentos e permitir que o
          dono da página entre em contato com quem se cadastrou no formulário dela. Não vendemos seus dados.
        </Section>

        <Section title="4. Com quem compartilhamos">
          Apenas com provedores que viabilizam o serviço, como operadores: Supabase (banco de dados e login), Vercel
          (hospedagem) e Stripe (pagamentos). Esses parceiros tratam os dados conforme suas próprias políticas e apenas
          para prestar o serviço.
        </Section>

        <Section title="5. Contatos captados nas páginas">
          Os dados enviados em um formulário de uma página pertencem ao criador daquela página, que é o responsável por
          usá-los de forma adequada e por responder a solicitações de quem se cadastrou. O {APP_NAME} atua como operador
          desses dados.
        </Section>

        <Section title="6. Seus direitos (LGPD)">
          Você pode solicitar acesso, correção, exclusão, portabilidade ou informações sobre o uso dos seus dados, além
          de revogar consentimento. Para exercer esses direitos, escreva para{" "}
          <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. Para dados enviados num formulário de uma
          página, você também pode falar diretamente com o criador daquela página.
        </Section>

        <Section title="7. Cookies">
          Usamos cookies essenciais para manter você conectado e para o funcionamento do serviço. Não usamos cookies de
          publicidade de terceiros.
        </Section>

        <Section title="8. Retenção">
          Guardamos os dados enquanto a conta ou a página existir e pelo tempo necessário para cumprir obrigações legais.
          Você pode pedir a exclusão a qualquer momento.
        </Section>

        <Section title="9. Alterações">
          Podemos atualizar esta Política. A data no topo indica a última revisão. Mudanças relevantes serão comunicadas
          pelos canais do serviço.
        </Section>

        <p className="text-sm text-stone-500">
          Dúvidas? Fale com a gente: <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-lg font-semibold text-stone-900">{title}</h2>
      <div className="text-stone-700">{children}</div>
    </section>
  );
}
