import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/env";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Regras de uso do ${APP_NAME}.`,
};

const CONTACT = "contato@vitamakers.com.br";
const UPDATED = "26 de outubro de 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">Termos de Uso</h1>
      <p className="mt-2 text-sm text-stone-500">Última atualização: {UPDATED}</p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-stone-700">
        <p>
          Estes Termos regem o uso do <strong>{APP_NAME}</strong>, operado pela Vita Makers. Ao criar uma conta ou usar o
          serviço, você concorda com estas regras. Se não concordar, não use o serviço.
        </p>

        <Section title="1. O serviço">
          O {APP_NAME} permite criar páginas de &quot;link na bio&quot; com blocos (links, vídeos, produtos, captação de
          contatos e outros), acompanhar estatísticas e, conforme o plano, usar recursos adicionais.
        </Section>

        <Section title="2. Sua conta">
          Você é responsável por manter seus dados de acesso em segurança e por toda atividade na sua conta. Mantenha
          seus dados de cadastro corretos e atualizados.
        </Section>

        <Section title="3. Uso aceitável">
          Você concorda em não usar o serviço para conteúdo ilegal, enganoso, ofensivo, que viole direitos de terceiros
          (incluindo marcas e direitos autorais), spam, golpes, malware ou qualquer atividade que prejudique o serviço ou
          outros usuários. Podemos suspender ou encerrar contas que violem estas regras.
        </Section>

        <Section title="4. Conteúdo">
          O conteúdo que você publica é seu e de sua responsabilidade. Você nos concede permissão para hospedar e exibir
          esse conteúdo apenas para operar o serviço. Você garante ter os direitos necessários sobre o que publica.
        </Section>

        <Section title="5. Planos e pagamentos">
          Alguns recursos dependem de planos pagos. Preços e limites podem mudar, com aviso prévio. Assinaturas e vendas
          são processadas pela Stripe. Tributos aplicáveis são de responsabilidade de cada parte conforme a lei.
        </Section>

        <Section title="6. Vendas feitas por você">
          Se você vende produtos ou serviços pela sua página, a relação de compra é entre você e o seu comprador. Você é
          responsável pela entrega, suporte, reembolsos e obrigações legais e fiscais dessas vendas. O {APP_NAME} apenas
          fornece a ferramenta.
        </Section>

        <Section title="7. Disponibilidade e limitação de responsabilidade">
          Fazemos o possível para manter o serviço no ar, mas ele é fornecido &quot;como está&quot;, sem garantias de
          disponibilidade ininterrupta. Na medida permitida por lei, não nos responsabilizamos por lucros cessantes ou
          danos indiretos decorrentes do uso do serviço.
        </Section>

        <Section title="8. Encerramento">
          Você pode excluir sua conta a qualquer momento nas Configurações. Podemos encerrar contas que violem estes
          Termos. Ao encerrar, os dados associados podem ser removidos conforme nossa{" "}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </Section>

        <Section title="9. Alterações">
          Podemos atualizar estes Termos. A data no topo indica a última revisão. O uso continuado após mudanças
          significa que você as aceita.
        </Section>

        <p className="text-sm text-stone-500">
          Dúvidas? Fale com a gente: <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. Veja também a{" "}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
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
