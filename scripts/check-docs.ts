#!/usr/bin/env bun
/**
 * Chequeo de coherencia de la documentación de producto (ADR-0070).
 *
 * Qué mira, y por qué cada cosa:
 *  1. Links relativos rotos en todo *.md del repo: el corte por épicas vive de links.
 *  2. Em-dashes (U+2014) en docs/: la convención de prosa del repo no los usa.
 *  3. Períodos codificados ("2025 1C") como copy en docs de producto: ADR-0051 y el glosario
 *     ("nunca codificada en letras").
 *  4. Las stories: una carpeta `US-NNN-slug/` por story adentro de su épica (que vive en su
 *     recorrido: student/, teacher/, team/; ADR-0077), con su `README.md` y su `scenarios.md`,
 *     ID único en todo el producto, y el índice de cada épica lista exactamente las que
 *     existen (ADR-0072). Las garantías son stories directas de guarantees/, mismo slice.
 *  5. Bloques mermaid balanceados y sin comillas dobles (rompen el render).
 *  6. Las pantallas: una carpeta `SC-NNN-slug` con ficha y boceto, ID único, los headings del
 *     contrato (docs/plan/screen-template.md), y trazabilidad simétrica con las stories: si una
 *     story dice resolverse en una pantalla, esa ficha tiene que listarla, y al revés.
 *  7. El filename y el título de un ADR van en inglés, como todo identificador del repo.
 *  8. Toda pantalla la pide una story de su propia épica. La simetría del 6 no alcanza: una
 *     pantalla citada solo por stories de otras épicas existe sin que nadie la haya pedido.
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
      // el ático está congelado y sus links apuntan a estados pasados del repo
      // (los ADRs rebasados se borran, 2026-08-25); la historia completa vive en git
      if (isHistory(f)) continue;
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

// 4. las stories: una carpeta por story con su letra y sus casos, ID único, y el índice de su
//    épica las lista a todas
const STORY = /^US-(\d+)-[a-z0-9-]+$/;
const seen = new Map<string, string>();
const productDir = join(ROOT, 'docs', 'product');
// las épicas son tramos de un recorrido (ADR-0077): viven un nivel adentro. Lo que no es
// un tramo vive al nivel producto: guarantees/ (stories directas) y notices/ (solo pantallas).
const JOURNEYS = ['student', 'reviewed', 'team'];
const epicRels: string[] = [];
if (existsSync(productDir)) {
  for (const j of JOURNEYS) {
    const jd = join(productDir, j);
    if (!existsSync(jd)) continue;
    for (const e of readdirSync(jd, { withFileTypes: true }))
      if (e.isDirectory()) epicRels.push(`${j}/${e.name}`);
  }
  if (existsSync(join(productDir, 'notices'))) epicRels.push('notices');
}
if (existsSync(productDir)) {
  for (const epic of epicRels) {
    const storiesDir = join(productDir, epic, 'stories');
    if (!existsSync(storiesDir)) continue;
    const files = readdirSync(storiesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
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
          detail: 'la carpeta tiene que llamarse US-NNN-slug-en-ingles',
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
      // la carpeta es el slice: la letra y los casos viven juntos
      for (const parte of ['README.md', 'scenarios.md']) {
        if (!existsSync(join(storiesDir, f, parte)))
          findings.push({
            file: `docs/product/${epic}/stories/${f}/`,
            line: 0,
            rule: 'slice-incompleto',
            detail: `${id} no tiene su ${parte}`,
          });
      }
      // el README de la épica es el índice: tiene que linkearla
      if (!idx.includes(`stories/${f}/`)) {
        findings.push({
          file: `docs/product/${epic}/README.md`,
          line: 0,
          rule: 'indice-incompleto',
          detail: `${id} tiene archivo y el índice de la épica no la lista`,
        });
      }
    }
    // y al revés: el índice no linkea stories que no existen
    for (const m of idx.matchAll(/\(stories\/(US-\d+-[a-z0-9-]+)\/README\.md\)/g)) {
      if (!files.includes(m[1]))
        findings.push({
          file: `docs/product/${epic}/README.md`,
          line: 0,
          rule: 'indice-roto',
          detail: `linkea ${m[1]}, que no existe`,
        });
    }
  }
  // las garantías: stories directas en guarantees/, mismo slice y mismo ID único
  const gdir = join(productDir, 'guarantees');
  if (existsSync(gdir)) {
    const gidx = existsSync(join(gdir, 'README.md'))
      ? readFileSync(join(gdir, 'README.md'), 'utf-8')
      : '';
    for (const d of readdirSync(gdir, { withFileTypes: true }).filter((x) => x.isDirectory())) {
      const m = d.name.match(STORY);
      if (!m) {
        findings.push({
          file: `docs/product/guarantees/${d.name}`,
          line: 0,
          rule: 'story-mal-nombrada',
          detail: 'la carpeta tiene que llamarse US-NNN-slug-en-ingles',
        });
        continue;
      }
      const id = `US-${m[1]}`;
      const prev = seen.get(id);
      if (prev)
        findings.push({
          file: `docs/product/guarantees/${d.name}`,
          line: 0,
          rule: 'id-duplicado',
          detail: `${id} ya existe en ${prev}`,
        });
      else seen.set(id, `guarantees/${d.name}`);
      for (const parte of ['README.md', 'scenarios.md']) {
        if (!existsSync(join(gdir, d.name, parte)))
          findings.push({
            file: `docs/product/guarantees/${d.name}/`,
            line: 0,
            rule: 'slice-incompleto',
            detail: `${id} no tiene su ${parte}`,
          });
      }
      if (!gidx.includes(`${d.name}/README.md`)) {
        findings.push({
          file: 'docs/product/guarantees/README.md',
          line: 0,
          rule: 'indice-incompleto',
          detail: `${id} tiene carpeta y el índice de garantías no la lista`,
        });
      }
    }
  }
}
// el índice general declara cuántas stories tiene cada épica: que no mienta
const indexPath = join(ROOT, 'docs', 'product', 'README.md');
if (existsSync(indexPath)) {
  for (const ln of readFileSync(indexPath, 'utf-8').split('\n')) {
    // la fila de una tabla: la primera celda linkea la carpeta, la anteúltima es Stories
    const cells = ln.split('|').map((x) => x.trim());
    const m = cells[1]?.match(/^\[[^\]]+\]\(([^)]+)\/README\.md\)$/);
    const num = cells[cells.length - 3];
    if (!m || !num || !/^\d+$/.test(num)) continue;
    const dir =
      m[1] === 'guarantees' ? join(productDir, 'guarantees') : join(productDir, m[1], 'stories');
    if (!existsSync(dir)) continue;
    const real = readdirSync(dir, { withFileTypes: true }).filter(
      (d) => d.isDirectory() && STORY.test(d.name),
    ).length;
    if (real !== Number(num))
      findings.push({
        file: 'docs/product/README.md',
        line: 0,
        rule: 'conteo-desincronizado',
        detail: `${m[1]}: el índice dice ${num} stories, hay ${real} carpetas`,
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
const garantias = new Set<string>(); // las que aplican a las 34 y solo citan ejemplos
if (existsSync(productDir)) {
  for (const epic of epicRels) {
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
  }
}
// lo que cada story declara en "Dónde se resuelve". Va en su propio loop: adentro del de
// arriba, la épica sin carpeta `screens/` se salteaba entera y sus stories no entraban acá,
// así que la trazabilidad no las miraba. Le pasaba a "Que no me molesten", que no tiene
// pantalla propia y es la que más cruza: sus cuatro stories nunca se verificaron.
if (existsSync(productDir)) {
  for (const epic of epicRels) {
    const sdir = join(productDir, epic, 'stories');
    if (!existsSync(sdir)) continue;
    for (const d of readdirSync(sdir, { withFileTypes: true }).filter((x) => x.isDirectory())) {
      const f = d.name;
      const id = f.match(/^(US-\d+)/)?.[1];
      if (!id || !existsSync(join(sdir, f, 'README.md'))) continue;
      const t = readFileSync(join(sdir, f, 'README.md'), 'utf-8');
      const sec = t.split('## Dónde se resuelve')[1]?.split(/^## /m)[0] ?? '';
      // una garantía transversal se declara tal cual y no tiene pantalla propia: aplica a las
      // 34, así que las que nombra son ejemplos ("donde más se juega"), nunca su lista entera
      if (sec.includes('garantía transversal')) garantias.add(id);
      storyScreens.set(id, new Set([...sec.matchAll(/\bSC-(\d+)\b/g)].map((x) => `SC-${x[1]}`)));
    }
  }
  // las garantías declaran su "Dónde se resuelve" con ejemplos: entran al mapa igual,
  // y la detección de abajo las exime de la simetría
  const gdir = join(productDir, 'guarantees');
  if (existsSync(gdir)) {
    for (const d of readdirSync(gdir, { withFileTypes: true }).filter((x) => x.isDirectory())) {
      const id = d.name.match(/^(US-\d+)/)?.[1];
      if (!id || !existsSync(join(gdir, d.name, 'README.md'))) continue;
      const t = readFileSync(join(gdir, d.name, 'README.md'), 'utf-8');
      const sec = t.split('## Dónde se resuelve')[1]?.split(/^## /m)[0] ?? '';
      garantias.add(id);
      storyScreens.set(id, new Set([...sec.matchAll(/\bSC-(\d+)\b/g)].map((x) => `SC-${x[1]}`)));
    }
  }
}
// la story dice una pantalla que no la lista, o al revés: una de las dos miente. Las garantías
// quedan afuera en las dos direcciones: aplican a las 34, así que ni la ficha les debe una
// entrada por mencionarlas ni ellas le deben una a cada pantalla que las honra. Exigirles
// simetría es pedirles una lista que por definición no pueden cerrar.
for (const [story, screens] of storyScreens) {
  if (garantias.has(story)) continue;
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
    if (garantias.has(st)) continue;
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

// 8. toda pantalla tiene una story de SU épica que la pida (ADR-0070 punto 7). La pantalla
//    es de la épica del acto que la origina, y que otras épicas le pongan condiciones no la
//    saca de ahí: Registro es de Entrar aunque cuatro épicas más le agreguen requisitos.
//    La simetría del punto 6 no alcanza para verlo: una pantalla puede estar citada solo por
//    stories de otras épicas que pasan por ahí, y entonces existe sin que nadie haya pedido
//    el acto. Le pasó a Recuperar, y de ahí salió US-220; le seguía pasando a Registro,
//    Ingresar y Error hasta que aparecieron US-228, US-229 y US-230, y esto no lo cantaba
//    nada. Las épicas sin carpeta `stories/` quedan afuera a propósito: son infraestructura
//    transversal que declara no tener requisitos propios (Avisos), y su README lo dice.
for (const [sc, ubicacion] of screenIds) {
  const epic = ubicacion.split('/')[0];
  if (!existsSync(join(productDir, epic, 'stories'))) continue;
  const propias = [...storyScreens].filter(
    ([us, pantallas]) => pantallas.has(sc) && seen.get(us)?.startsWith(`${epic}/`),
  );
  if (propias.length === 0) {
    findings.push({
      file: `docs/product/${ubicacion}/README.md`,
      line: 0,
      rule: 'pantalla-sin-story-duena',
      detail: `${sc} no la pide ninguna story de ${epic}: existe sin requisito que la origine`,
    });
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
    'check-docs: limpio (links, em-dashes, períodos, stories, pantallas, trazabilidad, mermaid, idioma de ADR, pantalla sin dueña).',
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
