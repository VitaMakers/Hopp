import type { SiteRender } from "./kit";
import { nautica } from "./nautica";
import { neon } from "./neon";
import { morada } from "./morada";
import { reforma } from "./reforma";
import { obra } from "./obra";
import { atelier } from "./atelier";
import { forja } from "./forja";
import { rota } from "./rota";
import { patinha } from "./patinha";
import { casapet } from "./casapet";
import { vetta } from "./vetta";
import { lume } from "./lume";
import { vigor } from "./vigor";
import { aurea } from "./aurea";
import { navalha } from "./navalha";

// Every design of the "site" family, by its theme.premium id.
export const SITE_RENDERS: Record<string, SiteRender> = { nautica, neon, morada, reforma, obra, atelier, forja, rota, patinha, casapet, vetta, lume, vigor, aurea, navalha };
