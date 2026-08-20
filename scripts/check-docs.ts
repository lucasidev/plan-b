#!/usr/bin/env bun
/**
 * Chequeo de coherencia de la documentación de producto (ADR-0070).
 *
 * Qué mira, y por qué cada cosa:
 *  1. Links relativos rotos en todo *.md del repo: el corte por épicas vive de links.
 *  2. Em-dashes (U+2014) en docs/: la convención de prosa del repo no los usa.
 *  3. Períodos codificados ("2025 1C") como copy en docs de producto: ADR-0051 y el glosario
 *     ("nunca codificada en letras").
 *  4. Cada story del catálogo vigente vive como fila en EXACTAMENTE UNA épica (ADR-0070 §2),
 *     y el índice del catálogo dice lo mismo que las carpetas.
 *  5. Bloques mermaid balanceados y sin comillas dobles (rompen el render).
 *
 * Señala, no bloquea: exit 0 siempre, salvo con --strict (para CI si algún día se quiere gate).
 * Uso: bun scripts/check-docs.ts [--strict]
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const STRICT = process.argv.includes("--strict");
const EMDASH = String.fromCharCode(0x2014);

type Finding = { file: string; line: number; rule: string; detail: string };
const findings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", "bin", "obj", ".next", "dist"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = walk(ROOT);
const mds = all.filter((f) => f.endsWith(".md"));
const rel = (f: string) => f.slice(ROOT.length + 1).split(sep).join("/");
const isDocs = (f: string) => rel(f).startsWith("docs/");
const isHistory = (f: string) => rel(f).startsWith("docs/history/");

// 1. links relativos rotos
const LINK = /\]\(([^)\s]+)\)/g;
for (const f of mds) {
  const lines = readFileSync(f, "utf-8").split("\n");
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(LINK)) {
      const target = m[1];
      if (/^(https?:|mailto:|#|\/)/.test(target)) continue;
      const core = target.split("#")[0];
      if (!core) continue;
      // los placeholders del template no son links reales
      if (core.includes("<") || core.includes("NNNN") || core.includes("US-NNN") || core === "...") continue;
      // el template es contenido de ejemplo, no un doc con links reales
      if (rel(f) === "docs/domain/us-template.md") continue;
      if (!existsSync(resolve(dirname(f), decodeURIComponent(core)))) {
        findings.push({ file: rel(f), line: i + 1, rule: "link-roto", detail: target });
      }
    }
  });
}

// 2. em-dashes y 3. períodos codificados, solo en docs de producto vivos
const CODED = /20\d\d[ -][12]C\b/;
// las fichas US de la versión anterior son evidencia congelada (no se reescriben), y
// lessons-learned documenta la lección de los em-dashes citando uno
const EMDASH_EXEMPT = (f: string) => rel(f).startsWith("docs/domain/user-stories/") || rel(f) === "docs/operations/lessons-learned.md";
for (const f of all.filter((x) => (x.endsWith(".md") || x.endsWith(".html")) && isDocs(x) && !isHistory(x))) {
  const lines = readFileSync(f, "utf-8").split("\n");
  lines.forEach((ln, i) => {
    if (ln.includes(EMDASH) && !EMDASH_EXEMPT(f)) findings.push({ file: rel(f), line: i + 1, rule: "em-dash", detail: ln.trim().slice(0, 60) });
    // en docs/reviews se citan violaciones textuales: no es copy de producto
    if (CODED.test(ln) && !rel(f).startsWith("docs/reviews/")) {
      findings.push({ file: rel(f), line: i + 1, rule: "periodo-codificado", detail: ln.trim().slice(0, 60) });
    }
  });
}

// 4. una story, una épica; y el índice del catálogo coincide
const ROW = /^\| ((?:O|T|BO)\d-\d+) \|/;
const rows = new Map<string, string[]>();
const epicsDir = join(ROOT, "docs", "epics");
if (existsSync(epicsDir)) {
  for (const epic of readdirSync(epicsDir)) {
    const readme = join(epicsDir, epic, "README.md");
    if (!existsSync(readme)) continue;
    for (const ln of readFileSync(readme, "utf-8").split("\n")) {
      const m = ln.match(ROW);
      if (m) rows.set(m[1], [...(rows.get(m[1]) ?? []), epic]);
    }
  }
}
for (const [id, epics] of rows) {
  if (epics.length > 1) findings.push({ file: "docs/epics", line: 0, rule: "story-duplicada", detail: `${id} en ${epics.join(", ")}` });
}
const catalogPath = join(ROOT, "docs", "domain", "user-stories.md");
if (existsSync(catalogPath)) {
  const cat = readFileSync(catalogPath, "utf-8");
  const idxSection = cat.split("## Índice por épica")[1]?.split("## Los temas")[0] ?? "";
  const idxIds = new Set([...idxSection.matchAll(/\b((?:O|T|BO)\d-\d+)\b/g)].map((m) => m[1]));
  for (const id of rows.keys()) {
    if (!idxIds.has(id)) findings.push({ file: "docs/domain/user-stories.md", line: 0, rule: "indice-desincronizado", detail: `${id} está en su épica y no en el índice` });
  }
  for (const id of idxIds) {
    if (!rows.has(id)) findings.push({ file: "docs/domain/user-stories.md", line: 0, rule: "indice-desincronizado", detail: `${id} está en el índice y en ninguna épica` });
  }
}

// 5. mermaid balanceado y sin comillas dobles
for (const f of mds.filter((x) => isDocs(x) && !isHistory(x))) {
  const text = readFileSync(f, "utf-8");
  const blocks = text.match(/```mermaid\n[\s\S]*?```/g) ?? [];
  const opens = (text.match(/```mermaid/g) ?? []).length;
  if (opens !== blocks.length) findings.push({ file: rel(f), line: 0, rule: "mermaid-sin-cerrar", detail: `${opens} aperturas` });
  for (const b of blocks) {
    // las comillas solo rompen los flowchart; en un erDiagram son sintaxis válida
    if (b.includes("flowchart") && b.includes('"')) findings.push({ file: rel(f), line: 0, rule: "mermaid-comillas", detail: "comillas dobles en un flowchart rompen el render" });
  }
}

// salida
if (findings.length === 0) {
  console.log("check-docs: limpio (links, em-dashes, períodos, stories 1:1, mermaid).");
  process.exit(0);
}
console.log(`check-docs: ${findings.length} hallazgo(s). Señala, no bloquea${STRICT ? " (modo --strict: bloquea)" : ""}.`);
for (const f of findings) {
  console.log(`  ${f.file}${f.line ? ":" + f.line : ""} [${f.rule}] ${f.detail}`);
}
process.exit(STRICT ? 1 : 0);
