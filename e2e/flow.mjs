// End-to-end walk through the app in a real browser. Run `npm run build`,
// `npm start`, then `npm run e2e`. E2E_ADMIN_CREATE=1 creates the account
// already confirmed (needs SUPABASE_SERVICE_ROLE_KEY) instead of signing up.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const RUN = Date.now().toString(36);
const EMAIL = process.env.E2E_EMAIL ?? `hopp.e2e.${RUN}@vitamakers.com.br`;
const PASSWORD = "senha-teste-123";
const HANDLE = process.env.E2E_HANDLE ?? `teste${RUN}`;
const SHOTS = new URL("./shots/", import.meta.url).pathname;
const log = (...a) => console.log("•", ...a);

const supa = process.env.NEXT_PUBLIC_SUPABASE_URL;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminHeaders = { apikey: srk, Authorization: `Bearer ${srk}`, "content-type": "application/json" };
async function rest(path) {
  const r = await fetch(`${supa}/rest/v1/${path}`, { headers: adminHeaders });
  return r.json();
}

const browser = await chromium.launch({ executablePath: process.env.E2E_CHROMIUM });
const ctx = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror ${page.url()}: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console ${page.url()}: ${m.text()}`));
const shot = (name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });

try {
  // 1. Criar conta
  if (process.env.E2E_ADMIN_CREATE === "1") {
    const r = await fetch(`${supa}/auth/v1/admin/users`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
    });
    log("usuário criado via admin:", r.status);
  }
  await page.goto(`${BASE}/login`);
  if (process.env.E2E_ADMIN_CREATE !== "1") {
    await page.getByRole("button", { name: "Não tem conta? Crie agora" }).click();
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();
  } else {
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
  }
  await page.waitForTimeout(4000);
  log("após cadastro:", page.url(), "|", (await page.locator("p.text-sm").allTextContents()).join(" / "));
  await shot("01-cadastro");

  if (page.url().includes("/login")) {
    if (process.env.E2E_CONFIRM !== "1") throw new Error("cadastro não entrou na conta");
    // E-mail confirmation is on: confirm through the admin API, then sign in.
    const users = await (await fetch(`${supa}/auth/v1/admin/users?per_page=200`, { headers: adminHeaders })).json();
    const u = users.users.find((x) => x.email === EMAIL);
    await fetch(`${supa}/auth/v1/admin/users/${u.id}`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ email_confirm: true }),
    });
    log("e-mail confirmado via admin");
    await page.goto(`${BASE}/login`);
    await page.getByLabel("E-mail").fill(EMAIL);
    await page.getByLabel("Senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 });
  }
  log("logado em:", page.url());

  // 2. Escolher endereço
  if (!page.url().includes("/onboarding")) await page.goto(`${BASE}/onboarding`);
  await page.getByLabel("Seu nome ou da marca").fill("Loja Teste");
  await page.locator('input[name="handle"]').fill(HANDLE.toUpperCase());
  await page.getByRole("button", { name: "Criar minha página" }).click();
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  log("onboarding ok →", page.url());
  await shot("02-editor-inicial");

  // 3. Montar a página
  const first = page.locator("text=Meu link").first();
  await first.click();
  await page.getByLabel("Texto do botão").fill("Meu site");
  await page.getByLabel("Endereço").fill("https://example.com/");
  await first.click().catch(() => {});
  await page.getByRole("button", { name: "+ Adicionar bloco" }).click();
  await page.getByRole("button", { name: /Captar contatos/ }).click();
  await page.getByRole("button", { name: "+ Adicionar bloco" }).click();
  await page.getByRole("button", { name: /^Título/ }).click();
  await page.getByRole("button", { name: "Perfil" }).click();
  await page.getByLabel("Bio").fill("Página de teste ponta a ponta");
  const addSocial = page.locator("select");
  if (await addSocial.count()) await addSocial.first().selectOption("instagram");
  const insta = page.getByLabel("Instagram");
  if (await insta.count()) await insta.fill("https://instagram.com/teste");
  await page.getByRole("button", { name: "Aparência" }).click();
  await page.getByRole("button", { name: /Noite/ }).first().click().catch(() => log("sem preset Noite"));
  await page.waitForSelector("text=Rascunho salvo", { timeout: 15000 });
  log("rascunho salvo");
  await shot("03-editor-montado");

  // 4. Publicar
  await page.getByRole("button", { name: "Publicar" }).click();
  await page.waitForSelector("text=Página publicada.", { timeout: 15000 });
  log("publicada");

  // 5. Página pública
  const pub = await ctx.newPage();
  pub.on("pageerror", (e) => errors.push(`pageerror pública: ${e.message}`));
  const resp = await pub.goto(`${BASE}/${HANDLE}`);
  log("pública status", resp.status(), "título:", await pub.title());
  await pub.waitForTimeout(1500);
  await pub.screenshot({ path: `${SHOTS}04-publica.png`, fullPage: true });
  const blockLink = pub.getByRole("link", { name: "Meu site" });
  log("botão Meu site visível:", await blockLink.isVisible());
  const [popup] = await Promise.all([pub.waitForEvent("popup").catch(() => null), blockLink.click()]);
  await popup?.close();
  const social = pub.getByRole("link", { name: "Instagram" });
  if (await social.count()) {
    const [p2] = await Promise.all([pub.waitForEvent("popup").catch(() => null), social.click()]);
    await p2?.close();
  }

  // 6. Captação
  await pub.getByPlaceholder("Seu e-mail").fill(`Lead.${RUN}@Example.com`);
  await pub.getByRole("button", { name: "Quero receber" }).click();
  await pub.waitForSelector("text=Pronto! Você está na lista.", { timeout: 10000 });
  log("inscrição ok");
  await pub.screenshot({ path: `${SHOTS}05-inscrito.png`, fullPage: true });

  // 7. Link curto
  await page.goto(`${BASE}/dashboard/links`);
  await page.getByLabel("Nome").fill("Promo teste");
  await page.locator('input[name="code"]').fill(`p${RUN}`);
  await page.getByLabel("Destino").fill("https://example.org/promo");
  await page.getByRole("button", { name: "Criar", exact: true }).click();
  await page.getByText(`/l/p${RUN}`).waitFor({ timeout: 10000 });
  log("link curto criado");
  await shot("06-links");
  const r = await fetch(`${BASE}/l/p${RUN}`, { redirect: "manual" });
  log("link curto →", r.status, r.headers.get("location"));
  const r404 = await fetch(`${BASE}/l/naoexiste${RUN}`, { redirect: "manual" });
  log("link inexistente →", r404.status, r404.headers.get("location"));

  // 8. Estatísticas e contatos
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/dashboard/analytics`);
  const stats = await page.locator("p.text-3xl").allTextContents();
  log("estatísticas (visitas, cliques, taxa):", stats.join(" | "));
  log("rankings:", (await page.locator("section ol").allInnerTexts()).map((t) => t.replace(/\n/g, " ")).join(" || "));
  await shot("07-estatisticas");
  await page.goto(`${BASE}/dashboard/contacts`);
  log("contatos:", (await page.locator("tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " ")).join(" || "));
  await shot("08-contatos");
  const csv = await page.evaluate(async () => (await fetch("/dashboard/contacts/export")).text());
  log("csv:", JSON.stringify(csv));

  const owner = (await rest(`profiles?handle=eq.${HANDLE}&select=id,handle`))[0];
  log("perfil no banco:", JSON.stringify(owner));
  const ev = await rest(`events?owner_id=eq.${owner.id}&select=kind,block_id,target`);
  log("eventos no banco:", JSON.stringify(ev));
  writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ EMAIL, HANDLE, RUN, ownerId: owner.id }));
} catch (e) {
  log("FALHOU:", e.message.split("\n")[0], "em", page.url());
  await shot("99-falha").catch(() => {});
  writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ EMAIL, HANDLE, RUN }));
} finally {
  if (errors.length) log("erros no navegador:\n  " + errors.join("\n  "));
  await browser.close();
}
