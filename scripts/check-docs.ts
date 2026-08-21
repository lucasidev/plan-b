#!/usr/bin/env bun
/**
 * Chequeo de coherencia de la documentación de producto (ADR-0070).
 *
 * Qué mira, y por qué cada cosa:
 *  1. Links relativos rotos en todo *.md del repo: el corte por épicas vive de links.
 *  2. Em-dashes (U+2014) en docs/: la convención de prosa del repo no los usa.
 *  3. Períodos codificados ("2025 1C") como copy en docs de producto: ADR-0051 y el glosario
 *     ("nunca codificada en letras").
 *  4. Las stories: una por archivo `US-NNN-slug.md` adentro de su épica, ID único en todo el
 *     producto, y el índice de cada épica lista exactamente las que existen (ADR-0072).
 *  5. Bloques mermaid balanceados y sin comillas dobles (rompen el render).
 *  6. Las pantallas: una carpeta `SC-NNN-slug` con ficha y boceto, ID único, los headings del
 *     contrato (docs/plan/screen-template.md), y trazabilidad simétrica con las stories: si una
 *     story dice resolverse en una pantalla, esa ficha tiene que listarla, y al revés.
 *
 * Señala, no bloquea: exit 0 siempre, salvo con --strict (para CI si algún día se quiere gate).
 * Uso: bun scripts/check-docs.ts [--strict]
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { detectLanguage } from './lib/detect-language.ts';

const ROOT = resolve(import.meta.dirname, '..');
const STRICT = process.argv.includes('--strict');
const EMDASH = String.fromCharCode(0x2014);

type Finding = { file: string; line: number; rule: string; detail: string };
const findings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'bin', 'obj', '.next', 'dist'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = walk(ROOT);
const mds = all.filter((f) => f.endsWith('.md'));
const rel = (f: string) =>
  f
    .slice(ROOT.length + 1)
    .split(sep)
    .join('/');
const isDocs = (f: string) => rel(f).startsWith('docs/');
const isHistory = (f: string) => rel(f).startsWith('docs/history/');

// 1. links relativos rotos
const LINK = /\]\(([^)\s]+)\)/g;
for (const f of mds) {
  const lines = readFileSync(f, 'utf-8').split('\n');
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(LINK)) {
      const target = m[1];
      if (/^(https?:|mailto:|#|\/)/.test(target)) continue;
      const core = target.split('#')[0];
      if (!core) continue;
      // los placeholders del template no son links reales
      if (core.includes('<') || core.includes('NNNN') || core.includes('US-NNN') || core === '...')
        continue;
      // el template es contenido de ejemplo, no un doc con links reales
      if (rel(f) === 'docs/plan/story-template.md' || rel(f) === 'docs/plan/screen-template.md')
        continue;
      if (!existsSync(resolve(dirname(f), decodeURIComponent(core)))) {
        findings.push({ file: rel(f), line: i + 1, rule: 'link-roto', detail: target });
      }
    }
  });
}

// 2. em-dashes y 3. períodos codificados, solo en docs de producto vivos
const CODED = /20\d\d[ -][12]C\b/;
// las fichas US de la versión anterior son evidencia congelada (no se reescriben), y
// lessons-learned documenta la lección de los em-dashes citando uno
const EMDASH_EXEMPT = (f: string) =>
  rel(f).startsWith('docs/history/') || rel(f) === 'docs/engineering/lessons-learned.md';
for (const f of all.filter(
  (x) => (x.endsWith('.md') || x.endsWith('.html')) && isDocs(x) && !isHistory(x),
)) {
  const lines = readFileSync(f, 'utf-8').split('\n');
  lines.forEach((ln, i) => {
    if (ln.includes(EMDASH) && !EMDASH_EXEMPT(f))
      findings.push({ file: rel(f), line: i + 1, rule: 'em-dash', detail: ln.trim().slice(0, 60) });
    // en docs/reviews se citan violaciones textuales: no es copy de producto
    if (CODED.test(ln) && !rel(f).startsWith('docs/reviews/')) {
      findings.push({
        file: rel(f),
        line: i + 1,
        rule: 'periodo-codificado',
        detail: ln.trim().slice(0, 60),
      });
    }
  });
}

// 4. las stories: un archivo por story, ID único, y el índice de su épica las lista a todas
const STORY = /^US-(\d+)-[a-z0-9-]+\.md$/;
const seen = new Map<string, string>();
const productDir = join(ROOT, 'docs', 'product');
if (existsSync(productDir)) {
  for (const epic of readdirSync(productDir)) {
    const storiesDir = join(productDir, epic, 'stories');
    if (!existsSync(storiesDir)) continue;
    const files = readdirSync(storiesDir).filter((f) => f.endsWith('.md'));
    const idx = existsSync(join(productDir, epic, 'README.md'))
      ? readFileSync(join(productDir, epic, 'README.md'), 'utf-8')
      : '';
    for (const f of files) {
      const m = f.match(STORY);
      if (!m) {
        findings.push({
          file: `docs/product/${epic}/stories/${f}`,
          line: 0,
          rule: 'story-mal-nombrada',
          detail: 'el nombre tiene que ser US-NNN-slug-en-ingles.md',
        });
        continue;
      }
      const id = `US-${m[1]}`;
      // el ID identifica una sola story en todo el producto
      const prev = seen.get(id);
      if (prev)
        findings.push({
          file: `docs/product/${epic}/stories/${f}`,
          line: 0,
          rule: 'id-duplicado',
          detail: `${id} ya existe en ${prev}`,
        });
      else seen.set(id, `${epic}/stories/${f}`);
      // el README de la épica es el índice: tiene que linkearla
      if (!idx.includes(f)) {
        findings.push({
          file: `docs/product/${epic}/README.md`,
          line: 0,
          rule: 'indice-incompleto',
          detail: `${id} tiene archivo y el índice de la épica no la lista`,
        });
      }
    }
    // y al revés: el índice no linkea stories que no existen
    for (const m of idx.matchAll(/\(stories\/(US-\d+-[a-z0-9-]+\.md)\)/g)) {
      if (!files.includes(m[1]))
        findings.push({
          file: `docs/product/${epic}/README.md`,
          line: 0,
          rule: 'indice-roto',
          detail: `linkea ${m[1]}, que no existe`,
        });
    }
  }
}
// el índice general declara cuántas stories tiene cada épica: que no mienta
const indexPath = join(ROOT, 'docs', 'product', 'README.md');
if (existsSync(indexPath)) {
  for (const ln of readFileSync(indexPath, 'utf-8').split('\n')) {
    const m = ln.match(/^\| \[[^\]]+\]\(([^/]+)\/README\.md\) \|[^|]*\|[^|]*\|[^|]*\| (\d+) \|/);
    if (!m) continue;
    const dir = join(productDir, m[1], 'stories');
    if (!existsSync(dir)) continue;
    const real = readdirSync(dir).filter((f) => f.endsWith('.md')).length;
    if (real !== Number(m[2]))
      findings.push({
        file: 'docs/product/README.md',
        line: 0,
        rule: 'conteo-desincronizado',
        detail: `${m[1]}: el índice dice ${m[2]} stories, hay ${real} archivos`,
      });
  }
}

// 5. mermaid balanceado y sin comillas dobles
for (const f of mds.filter((x) => isDocs(x) && !isHistory(x))) {
  const text = readFileSync(f, 'utf-8');
  const blocks = text.match(/```mermaid\n[\s\S]*?```/g) ?? [];
  const opens = (text.match(/```mermaid/g) ?? []).length;
  if (opens !== blocks.length)
    findings.push({
      file: rel(f),
      line: 0,
      rule: 'mermaid-sin-cerrar',
      detail: `${opens} aperturas`,
    });
  for (const b of blocks) {
    // las comillas solo rompen los flowchart; en un erDiagram son sintaxis válida
    if (b.includes('flowchart') && b.includes('"'))
      findings.push({
        file: rel(f),
        line: 0,
        rule: 'mermaid-comillas',
        detail: 'comillas dobles en un flowchart rompen el render',
      });
  }
}

// 6. las pantallas: nombre SC-NNN-slug, ID único, contrato de ficha, y trazabilidad en las dos
//    direcciones con las stories (ADR-0070; contrato en docs/plan/screen-template.md)
const SCREEN = /^SC-(\d+)-[a-z0-9-]+$/;
const CONTRATO = [
  'Quién la usa',
  'Qué stories resuelve',
  'Qué muestra',
  'Estados',
  'Lo que no muestra nunca',
  'Adónde va',
  'Decisiones que aplica',
  'Lo que esta ficha deja abierto',
];
const screenIds = new Map<string, string>();
const screenStories = new Map<string, Set<string>>(); // SC-NNN -> stories que declara
const storyScreens = new Map<string, Set<string>>(); // US-NNN -> pantallas que declara
if (existsSync(productDir)) {
  for (const epic of readdirSync(productDir)) {
    const dir = join(productDir, epic, 'screens');
    if (!existsSync(dir)) continue;
    for (const scr of readdirSync(dir)) {
      const m = scr.match(SCREEN);
      const ficha = join(dir, scr, 'README.md');
      if (!m) {
        findings.push({
          file: `docs/product/${epic}/screens/${scr}`,
          line: 0,
          rule: 'pantalla-mal-nombrada',
          detail: 'tiene que ser SC-NNN-slug-en-ingles',
        });
        continue;
      }
      const id = `SC-${m[1]}`;
      const prev = screenIds.get(id);
      if (prev)
        findings.push({
          file: `docs/product/${epic}/screens/${scr}`,
          line: 0,
          rule: 'id-duplicado',
          detail: `${id} ya existe en ${prev}`,
        });
      else screenIds.set(id, `${epic}/screens/${scr}`);
      if (!existsSync(join(dir, scr, 'sketch.html'))) {
        findings.push({
          file: `docs/product/${epic}/screens/${scr}`,
          line: 0,
          rule: 'pantalla-sin-boceto',
          detail: 'falta sketch.html',
        });
      }
      if (!existsSync(ficha)) {
        findings.push({
          file: `docs/product/${epic}/screens/${scr}`,
          line: 0,
          rule: 'pantalla-sin-ficha',
          detail: 'falta README.md',
        });
        continue;
      }
      const t = readFileSync(ficha, 'utf-8');
      const heads = [...t.matchAll(/^## (.+)$/gm)].map((x) => x[1].trim());
      for (const h of CONTRATO) {
        if (!heads.includes(h))
          findings.push({
            file: `docs/product/${epic}/screens/${scr}/README.md`,
            line: 0,
            rule: 'ficha-sin-seccion',
            detail: `falta "## ${h}"`,
          });
      }
      // solo la sección declarativa: una mención en el cuerpo ("acá NO se pregunta US-146") no
      // significa que la pantalla resuelva esa story
      const decl = t.split('## Qué stories resuelve')[1]?.split(/^## /m)[0] ?? '';
      screenStories.set(id, new Set([...decl.matchAll(/\bUS-(\d+)\b/g)].map((x) => `US-${x[1]}`)));
    }
    // lo que cada story declara en "Dónde se resuelve"
    const sdir = join(productDir, epic, 'stories');
    if (!existsSync(sdir)) continue;
    for (const f of readdirSync(sdir).filter((x) => x.endsWith('.md'))) {
      const id = f.match(/^(US-\d+)/)?.[1];
      if (!id) continue;
      const t = readFileSync(join(sdir, f), 'utf-8');
      const sec = t.split('## Dónde se resuelve')[1]?.split(/^## /m)[0] ?? '';
      storyScreens.set(id, new Set([...sec.matchAll(/\bSC-(\d+)\b/g)].map((x) => `SC-${x[1]}`)));
    }
  }
}
// la story dice una pantalla que no la lista, o al revés: una de las dos miente
for (const [story, screens] of storyScreens) {
  for (const sc of screens) {
    if (!screenIds.has(sc)) {
      findings.push({
        file: `story ${story}`,
        line: 0,
        rule: 'trazabilidad-rota',
        detail: `declara ${sc}, que no existe`,
      });
      continue;
    }
    if (!screenStories.get(sc)?.has(story))
      findings.push({
        file: `docs/product/${screenIds.get(sc)}/README.md`,
        line: 0,
        rule: 'trazabilidad-asimetrica',
        detail: `${story} dice resolverse acá y la ficha no la lista`,
      });
  }
}
for (const [sc, stories] of screenStories) {
  for (const st of stories) {
    const declared = storyScreens.get(st);
    if (declared && !declared.has(sc)) {
      findings.push({
        file: `docs/product/${screenIds.get(sc)}/README.md`,
        line: 0,
        rule: 'trazabilidad-asimetrica',
        detail: `lista ${st} y esa story no declara esta pantalla`,
      });
    }
  }
}

// 7. el filename y el título de un ADR son identificadores: van en inglés
//    (docs/decisions/README.md; el cuerpo va en español). Los 60 que estaban en
//    español se migraron el 2026-08-21, así que acá no hay excepciones ni número
//    de corte: si un ADR nuevo sale en español, se canta.
const ADR = /^\d{4}-[a-z0-9-]+\.md$/;
const decisionsDir = join(ROOT, 'docs', 'decisions');
for (const f of readdirSync(decisionsDir).filter((x) => ADR.test(x))) {
  const slug = f.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
  const title = readFileSync(join(decisionsDir, f), 'utf-8').match(/^# ADR-\d+: (.*)$/m)?.[1] ?? '';
  if (detectLanguage(slug) === 'es') {
    findings.push({
      file: `docs/decisions/${f}`,
      line: 0,
      rule: 'adr-en-espanol',
      detail: 'el filename es un identificador y va en inglés',
    });
  }
  if (title && detectLanguage(title) === 'es') {
    findings.push({
      file: `docs/decisions/${f}`,
      line: 1,
      rule: 'adr-en-espanol',
      detail: `el título va en inglés: "${title.slice(0, 60)}"`,
    });
  }
}

// salida
if (findings.length === 0) {
  console.log(
    'check-docs: limpio (links, em-dashes, períodos, stories, pantallas, trazabilidad, mermaid, idioma de ADR).',
  );
  process.exit(0);
}
console.log(
  `check-docs: ${findings.length} hallazgo(s). Señala, no bloquea${STRICT ? ' (modo --strict: bloquea)' : ''}.`,
);
for (const f of findings) {
  console.log(`  ${f.file}${f.line ? `:${f.line}` : ''} [${f.rule}] ${f.detail}`);
}
process.exit(STRICT ? 1 : 0);
