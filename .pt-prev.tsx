import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync } from "fs";
import { buildSiteCtx } from "@/components/page-view/site/kit";
import { patinha } from "@/components/page-view/site/patinha";
import { patinhaTemplate as t } from "@/lib/page/site/patinha";
import { pageDocSchema, PREMIUM_DEFAULTS } from "@/lib/page/schema";
const order = t.premium.partOrder!;
const raw: any = { version: 1, profile: { name: "Patinha", bio: t.bio, avatarUrl: "", coverUrl: "", logo: "" }, socials: t.socials, blocks: t.blocks(), premium: { ...PREMIUM_DEFAULTS, ...t.premium }, seo: { title: "", description: "" }, theme: {} };
let doc: any; const r = pageDocSchema.safeParse(raw);
if (r.success) doc = r.data; else { console.log(JSON.stringify(r.error.issues.slice(0,6))); doc = raw; }
const nodes: any = patinha(buildSiteCtx(doc, undefined, "Patinha"));
const body = order.map((id) => nodes[id.slice(8)] ? `<section class="sp sp-${id.slice(8)}">${renderToStaticMarkup(nodes[id.slice(8)])}</section>` : "").join("") + `<footer class="sp sp-footer">${renderToStaticMarkup(nodes.footer)}</footer>`;
const css = readFileSync("src/app/site/base.css", "utf8") + readFileSync("src/app/site/patinha.css", "utf8");
writeFileSync(process.argv[2], `<meta charset=utf8><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400..800&display=swap" rel=stylesheet><style>body{margin:0}${css.replaceAll('"Outfit Variable"','Outfit')}</style><div class="site site-patinha site-light" style="container-type:inline-size;--s-bg:${t.theme.background};--s-text:${t.theme.text};--s-accent:${t.theme.accent};--s-on-accent:#fff">${body}</div>`);
