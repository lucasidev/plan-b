#!/usr/bin/env bun
/**
 * Gate de escenarios de las stories bajo el gate (issue #407): cada E/N/X de su scenarios.md
 * termina en un veredicto (confirmado, roto o no construido) citado por un test vivo o marcado
 * a mano, nunca mudo. Existe porque la auditoría de tests de R1 a R3 encontró que los
 * escenarios no gobernaban los tests (9 de 75 citados, hallazgo Q01).
 *
 * Formas de cita aceptadas (siempre en una sola línea, en el docstring o comentario pegado a
 * la declaración del test, en su DisplayName, o en su título si la declaración es de una sola
 * línea (un .each multilínea cuenta por el docstring de arriba, no por el título); un
 * describe() no cuenta): "US-146 E1", "US-146, E1", "US-146: E1", "[US-146] E1",
 * "US-198 E2, E3" (lista completa separada por comas o "y"), "E1 de US-146",
 * "E1 y E2 de US-146". Declaraciones reconocidas: [Fact], [Theory],
 * test(, it(, sus .only y sus .each (test.each(, it.each(, test.only.each(, it.only.each(). La
 * declaración se busca únicamente hacia adelante, por el bloque de comentario/atributo que
 * envuelve a la cita (sin límite de líneas); no hay barrido hacia atrás. Una cita que no llega
 * a una declaración es hallazgo informativo, no gatea --strict.
 *
 * Uso: bun scripts/check-scenarios.ts [--strict]
 */

import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const STRICT = process.argv.includes('--strict');

type Verdict = 'confirmado' | 'roto' | 'no construido' | 'sin veredicto';
type Scenario = { id: string; line: number; roto: number | null; noConstruido: boolean };
type Finding = { file: string; line: number; rule: string; detail: string };
type StoryRow = { id: string; name: string; sprint: string };
type StoryResult = StoryRow & { file: string; scenarios: Scenario[]; fileFound: boolean };
type CitationRecord = { storyId: string; scenarioId: string; file: string; line: number };
type RotoRecord = {
  file: string;
  line: number;
  storyId: string;
  scenarioId: string;
  issue: number;
};

const findings: Finding[] = [];
const rel = (f: string) =>
  f
    .slice(ROOT.length + 1)
    .split(sep)
    .join('/');
const toSlash = (p: string) => p.replace(/\\/g, '/');

function walk(dir: string, exclude: string[], out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (exclude.includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exclude, out);
    else out.push(p);
  }
  return out;
}

// 1. la sección del tracker gobierna qué IDs cubre este gate. El ID se busca (no se exige
//    que sea la celda entera): puede venir como "US-198", "[US-198](...)" o "**US-198**".
//    Fila 1 de la tabla es el encabezado, fila 2 el separador; ninguna de las dos es dato.
const STATUS_REL = 'docs/plan/status.md';
const HEADING = '## Stories bajo el gate de escenarios';
const statusLines = readFileSync(join(ROOT, STATUS_REL), 'utf-8').split('\n');
const headingIdx = statusLines.findIndex((l) => l.trim() === HEADING);
if (headingIdx === -1) {
  console.error(
    `check-scenarios: ${STATUS_REL} no tiene una sección "${HEADING}". Sin eso no hay lista de stories que gatear.`,
  );
  process.exit(1);
}
let sectionEnd = statusLines.length;
for (let i = headingIdx + 1; i < statusLines.length; i++) {
  if (/^## /.test(statusLines[i])) {
    sectionEnd = i;
    break;
  }
}

const ID_IN_CELL = /US-\d{3}\b/;
const seenIds = new Set<string>();
const stories: StoryRow[] = [];
let pipeRowsSeen = 0;
for (let i = headingIdx + 1; i < sectionEnd; i++) {
  const ln = statusLines[i];
  if (!ln.trim().startsWith('|')) continue;
  pipeRowsSeen++;
  if (pipeRowsSeen <= 2) continue; // 1: encabezado, 2: separador
  const cells = ln.split('|').map((c) => c.trim());
  const idMatch = cells[1]?.match(ID_IN_CELL);
  const lineNum = i + 1;
  if (!idMatch) {
    findings.push({
      file: STATUS_REL,
      line: lineNum,
      rule: 'fila-sin-id',
      detail: `no se encontró un US-NNN en "${cells[1] ?? ''}"`,
    });
    continue;
  }
  const id = idMatch[0];
  if (seenIds.has(id)) {
    findings.push({
      file: STATUS_REL,
      line: lineNum,
      rule: 'id-repetido',
      detail: `${id} ya aparece antes en la tabla`,
    });
    continue;
  }
  seenIds.add(id);
  stories.push({ id, name: cells[2] ?? '', sprint: cells[3] ?? '' });
}
if (stories.length === 0) {
  console.error(
    `check-scenarios: la sección "${HEADING}" de ${STATUS_REL} no tiene filas de tabla reconocibles.`,
  );
  process.exit(1);
}

// 2. cada story tiene su scenarios.md (docs/product/**/US-<id>-*/, sin exigir el segmento
//    "stories/": las garantías viven directo en docs/product/guarantees/). Sus marcas E/N/X
//    (espacio inicial y punto opcionales), y Roto:/No construido: debajo de cada una, hasta el
//    escenario siguiente o el próximo heading, lo que venga primero. La forma canónica de una
//    marca es una línea, con un bullet opcional al inicio (-, *, + o > seguido de espacios, los
//    cuatro prefijos de bullet/cita de markdown) más "Roto: #NNN" (número > 0) o
//    "No construido: <razón>"; una línea del rango que EMPIECE (después de ese bullet opcional,
//    sin distinguir mayúsculas) con "roto" o "no construido" sin cumplir esa forma es un
//    hallazgo (la palabra en medio de la prosa, como "el enlace roto no rompe la ficha", no
//    cuenta). Las líneas dentro de un fence ``` no son heading, escenario ni marca; un fence
//    que no cierra antes del fin del archivo es hallazgo aparte, con la línea donde abrió.
const SCENARIO_MARK = /^\s*\*\*([A-Z])(\d+)\.?\*\*/;
const ROTO_LINE = /^(?:[-*+>]\s+)?Roto:\s*\[?#(\d+)\]?/;
const NO_CONSTRUIDO_LINE = /^(?:[-*+>]\s+)?No construido:\s*(.*)$/;
const MENTIONS_MARK = /^(?:[-*+>]\s+)?(roto|no construido)/i;

function computeFenceMask(lines: string[]): { mask: boolean[]; unclosedAt: number | null } {
  const mask = new Array(lines.length).fill(false);
  let inFence = false;
  let openedAt: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('```')) {
      inFence = !inFence;
      mask[i] = true;
      openedAt = inFence ? i : null;
      continue;
    }
    mask[i] = inFence;
  }
  return { mask, unclosedAt: inFence ? openedAt : null };
}

function blockEnd(lines: string[], fence: boolean[], from: number, hardEnd: number): number {
  for (let i = from; i < hardEnd; i++) {
    if (fence[i]) continue;
    if (/^#/.test(lines[i])) return i;
  }
  return hardEnd;
}

function loadScenariosFromFile(hitPath: string): Scenario[] {
  const file = toSlash(hitPath);
  const lines = readFileSync(join(ROOT, hitPath), 'utf-8').split('\n');
  const { mask: fence, unclosedAt } = computeFenceMask(lines);
  if (unclosedAt !== null) {
    findings.push({
      file,
      line: unclosedAt + 1,
      rule: 'fence-sin-cerrar',
      detail: 'el fence ``` que abre acá no cierra antes del fin del archivo',
    });
  }
  const marks: { idx: number; letter: string; num: string }[] = [];
  lines.forEach((ln, i) => {
    if (fence[i]) return;
    const m = ln.match(SCENARIO_MARK);
    if (m) marks.push({ idx: i, letter: m[1], num: m[2] });
  });
  const scenarios: Scenario[] = [];
  const seenScenarioIds = new Set<string>();
  marks.forEach((mk, i) => {
    if (mk.letter !== 'E' && mk.letter !== 'N' && mk.letter !== 'X') {
      // otra letra que no sea escenario ni invariante: informativo, no entra al gate
      findings.push({
        file,
        line: mk.idx + 1,
        rule: 'escenario-letra-no-reconocida',
        detail: `${mk.letter}${mk.num}: la letra no es E, N ni X`,
      });
      return;
    }
    const id = `${mk.letter}${mk.num}`;
    const nextMarkIdx = i + 1 < marks.length ? marks[i + 1].idx : lines.length;
    const end = blockEnd(lines, fence, mk.idx + 1, nextMarkIdx);
    let roto: number | null = null;
    let noConstruido = false;
    for (let j = mk.idx + 1; j < end; j++) {
      if (fence[j]) continue;
      const trimmed = lines[j].trim();
      const rm = trimmed.match(ROTO_LINE);
      if (rm) {
        const n = Number(rm[1]);
        if (n > 0) {
          roto = n;
        } else {
          findings.push({
            file,
            line: j + 1,
            rule: 'marca-mal-escrita',
            detail: `"${trimmed}": el número del issue tiene que ser mayor que cero`,
          });
        }
        continue;
      }
      const nm = trimmed.match(NO_CONSTRUIDO_LINE);
      if (nm) {
        if (nm[1].trim().length > 0) {
          noConstruido = true;
        } else {
          findings.push({
            file,
            line: j + 1,
            rule: 'marca-mal-escrita',
            detail: `"${trimmed}": falta la razón`,
          });
        }
        continue;
      }
      if (MENTIONS_MARK.test(trimmed)) {
        findings.push({
          file,
          line: j + 1,
          rule: 'marca-mal-escrita',
          detail: `"${trimmed}": no tiene la forma "Roto: #NNN" ni "No construido: razón"`,
        });
      }
    }
    if (seenScenarioIds.has(id)) {
      findings.push({
        file,
        line: mk.idx + 1,
        rule: 'escenario-repetido',
        detail: `${id} ya está declarado antes en este archivo`,
      });
      return; // se cuenta una vez: la repetición no se agrega
    }
    seenScenarioIds.add(id);
    scenarios.push({ id, line: mk.idx + 1, roto, noConstruido });
  });
  return scenarios;
}

const results: StoryResult[] = [];
for (const story of stories) {
  const hits = globSync(`docs/product/**/${story.id}-*/scenarios.md`, { cwd: ROOT });
  if (hits.length > 1) {
    findings.push({
      file: `story ${story.id}`,
      line: 0,
      rule: 'story-duplicada',
      detail: `${hits.length} scenarios.md encontrados: ${hits.map(toSlash).join(', ')}`,
    });
    continue; // no se cuenta
  }
  if (hits.length === 0) {
    findings.push({
      file: `story ${story.id}`,
      line: 0,
      rule: 'story-sin-scenarios',
      detail: `no se encontró docs/product/**/${story.id}-*/scenarios.md`,
    });
    results.push({ ...story, file: '', scenarios: [], fileFound: false });
    continue;
  }
  const file = toSlash(hits[0]);
  const scenarios = loadScenariosFromFile(hits[0]);
  if (scenarios.length === 0) {
    findings.push({
      file,
      line: 0,
      rule: 'story-sin-escenarios',
      detail: 'scenarios.md existe pero no se extrajo ningún escenario E/N/X',
    });
  }
  results.push({ ...story, file, scenarios, fileFound: true });
}

// 3. solo cuentan citas en archivos de TEST: backend con segmento "tests/" en su path
//    (modules/*/tests/ y backend/tests/), frontend *.test.ts(x) y e2e *.spec.ts.
const TEST_EXCLUDE = [
  'node_modules',
  'bin',
  'obj',
  '.next',
  'dist',
  '.stryker-tmp',
  'StrykerOutput',
];
const testFiles = [
  ...walk(join(ROOT, 'backend'), TEST_EXCLUDE).filter(
    (f) => f.endsWith('.cs') && rel(f).split('/').includes('tests'),
  ),
  ...walk(join(ROOT, 'frontend', 'src'), TEST_EXCLUDE).filter(
    (f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx'),
  ),
  ...walk(join(ROOT, 'frontend', 'e2e'), TEST_EXCLUDE).filter((f) => f.endsWith('.spec.ts')),
];

// listas de escenarios separadas por coma o "y": "E2, E3", "E2 y N1", o un solo token.
const SCENARIO_LIST = '(?:[ENX]\\d+(?:\\s*(?:,|y)\\s*)?)+';
const CITE_ID_FIRST = new RegExp(`\\[?US-(\\d+)\\]?[:,\\s]+(${SCENARIO_LIST})`, 'g');
const CITE_SCENARIO_FIRST = new RegExp(`(${SCENARIO_LIST})\\s+de\\s+US-(\\d+)`, 'g');
const TOKEN = /[ENX]\d+/g;

// declaración de test, únicamente hacia adelante: un barrido hacia atrás colgaba una cita del
// test de arriba aunque el propio estuviera apagado, y \btest\( matcheaba cualquier RE.test(s)
// de código que llamara a un regex. El bloque es contiguo: comentario (//, ///, /*, *, */) o
// atributo C# con identificador (^\[[A-Z]\w*, como [Fact], [Trait(; un "[" solo o seguido de un
// literal es código, no atributo); una línea en blanco lo corta. [Fact/[Theory y Skip= se leen
// SOLO en líneas de atributo, nunca en un comentario (uno que hable de "[Fact]" o "Skip =" en
// prosa no cuenta). Un atributo que abre "(" o "[" sin cerrar en la misma línea sigue en las
// líneas que vienen hasta que cierra, hasta una línea en blanco, o hasta 20 líneas (lo que
// venga primero). Esas líneas de continuación también se miran por [Fact/[Theory (un string
// con un "(" suelto, como "Regex(", desbalancea el conteo y puede tragarse el atributo
// siguiente; por eso se sigue buscando ahí adentro) y por Skip=, salvo que la línea de
// continuación sea a su vez un comentario "//" (ni [Fact/[Theory ni Skip= dentro de un
// comentario cuentan; uno mencionando "[Fact]" o "Skip =" en prosa, como en un parámetro de
// [InlineData(, no confirma ni apaga nada). Confirma si el bloque contuvo [Fact o [Theory sin
// Skip =, o si la primera línea de código empieza con test(, it(, sus .only, o sus .each
// (test.each(, test.only.each(, it.each(, it.only.each(); apagado si trae Skip =, o empieza
// con test.fixme(, test.skip(, test.skip.each(, it.skip(, it.skip.each(, xit( o xit.each(.
// Cualquier otra cosa (función, clase, export, describe() no es declaración.
const COMMENT_LINE = /^(\/\/|\/\*|\*)/;
const ATTRIBUTE_LINE = /^\[[A-Z]\w*/;
const FACT_OR_THEORY = /\[Fact|\[Theory/;
const SKIP_MARK = /Skip\s*=/;
const LIVE_FIRST_CODE_LINE =
  /^(test\(|test\.only\(|test\.each\(|test\.only\.each\(|it\(|it\.only\(|it\.each\(|it\.only\.each\()/;
const DISABLED_FIRST_CODE_LINE =
  /^(test\.fixme\(|test\.skip\(|test\.skip\.each\(|it\.skip\(|it\.skip\.each\(|xit\(|xit\.each\()/;

// cuenta paréntesis y corchetes: positivo = quedan sin cerrar, la línea de atributo sigue.
function bracketDelta(line: string): number {
  let delta = 0;
  for (const ch of line) {
    if (ch === '(' || ch === '[') delta++;
    else if (ch === ')' || ch === ']') delta--;
  }
  return delta;
}

type Declaration = 'live' | 'disabled' | 'none';

function findDeclaration(lines: string[], citationIdx: number): Declaration {
  let i = citationIdx;
  let hasFactOrTheory = false;
  let hasSkip = false;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (COMMENT_LINE.test(t)) {
      i++;
      continue;
    }
    if (ATTRIBUTE_LINE.test(t)) {
      if (FACT_OR_THEORY.test(t)) hasFactOrTheory = true;
      if (SKIP_MARK.test(t)) hasSkip = true;
      let balance = bracketDelta(t);
      i++;
      let contCount = 0;
      while (balance > 0 && i < lines.length && contCount < 20) {
        const cont = lines[i].trim();
        if (cont === '') break; // línea en blanco corta la continuación
        if (!cont.startsWith('//') && FACT_OR_THEORY.test(cont)) hasFactOrTheory = true;
        if (!cont.startsWith('//') && SKIP_MARK.test(cont)) hasSkip = true;
        balance += bracketDelta(cont);
        i++;
        contCount++;
      }
      continue;
    }
    break;
  }
  if (hasFactOrTheory) return hasSkip ? 'disabled' : 'live';
  if (i < lines.length) {
    const firstCode = lines[i].trim();
    if (DISABLED_FIRST_CODE_LINE.test(firstCode)) return 'disabled';
    if (LIVE_FIRST_CODE_LINE.test(firstCode)) return 'live';
  }
  return 'none';
}

const citedSet = new Set<string>();
const citationsForTypoCheck: CitationRecord[] = [];

for (const f of testFiles) {
  const lines = readFileSync(f, 'utf-8').split('\n');
  const fileRel = rel(f);

  const recordCitation = (storyId: string, scenarioId: string, lineIdx: number) => {
    const decl = findDeclaration(lines, lineIdx);
    if (decl === 'disabled') {
      findings.push({
        file: fileRel,
        line: lineIdx + 1,
        rule: 'cita-en-test-apagado',
        detail: `${storyId} ${scenarioId}: la cita cae en un test apagado`,
      });
      return;
    }
    if (decl === 'none') {
      // nada se descarta mudo: no llega a una declaración, pero queda dicho
      findings.push({
        file: fileRel,
        line: lineIdx + 1,
        rule: 'cita-sin-test',
        detail: `${storyId} ${scenarioId}: no llega a una declaración de test`,
      });
      return;
    }
    citedSet.add(`${storyId}|${scenarioId}`);
    citationsForTypoCheck.push({ storyId, scenarioId, file: fileRel, line: lineIdx + 1 });
  };

  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(CITE_ID_FIRST)) {
      const storyId = `US-${m[1]}`;
      for (const tok of m[2].matchAll(TOKEN)) recordCitation(storyId, tok[0], i);
    }
    for (const m of ln.matchAll(CITE_SCENARIO_FIRST)) {
      const storyId = `US-${m[2]}`;
      for (const tok of m[1].matchAll(TOKEN)) recordCitation(storyId, tok[0], i);
    }
  });
}

// 4. una cita a un escenario que no existe en la story (typo o escenario borrado), solo para
//    las stories bajo el gate que sí tienen scenarios.md
const knownScenarios = new Map(
  results.filter((r) => r.fileFound).map((r) => [r.id, new Set(r.scenarios.map((s) => s.id))]),
);
const citaSinEscenario = citationsForTypoCheck.filter((c) => {
  const set = knownScenarios.get(c.storyId);
  return set !== undefined && !set.has(c.scenarioId);
});

// 5. veredicto por escenario. Roto: gana siempre (el test puede existir y el código no cumple
//    igual, es el estado normal). No construido: con una cita válida es una marca caduca.
type Row = {
  story: string;
  total: number;
  confirmado: number;
  roto: number;
  noConstruido: number;
  sinVeredicto: number;
};
const rows: Row[] = [];
const rotoList: RotoRecord[] = [];
const sinVeredictoList: { file: string; line: number; storyId: string; scenarioId: string }[] = [];

for (const r of results) {
  const row: Row = {
    story: r.id,
    total: 0,
    confirmado: 0,
    roto: 0,
    noConstruido: 0,
    sinVeredicto: 0,
  };
  for (const sc of r.scenarios) {
    row.total++;
    const hasCitation = citedSet.has(`${r.id}|${sc.id}`);
    let verdict: Verdict;
    if (sc.roto !== null) {
      verdict = 'roto';
      rotoList.push({
        file: r.file,
        line: sc.line,
        storyId: r.id,
        scenarioId: sc.id,
        issue: sc.roto,
      });
    } else if (sc.noConstruido) {
      verdict = 'no construido';
      if (hasCitation) {
        findings.push({
          file: r.file,
          line: sc.line,
          rule: 'marca-caduca',
          detail: `${r.id} ${sc.id}: marcado "No construido" pero un test lo cita`,
        });
      }
    } else if (hasCitation) {
      verdict = 'confirmado';
    } else {
      verdict = 'sin veredicto';
      sinVeredictoList.push({ file: r.file, line: sc.line, storyId: r.id, scenarioId: sc.id });
    }
    if (verdict === 'confirmado') row.confirmado++;
    else if (verdict === 'roto') row.roto++;
    else if (verdict === 'no construido') row.noConstruido++;
    else row.sinVeredicto++;
  }
  rows.push(row);
}

// salida: tabla por story, otros hallazgos, rotos, escenarios sin veredicto, citas sin
// escenario, total
function printTable(headers: string[], data: string[][]) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...data.map((row) => row[i]?.length ?? 0)),
  );
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join(' | ');
  console.log(line(headers));
  console.log(widths.map((w) => '-'.repeat(w)).join('-|-'));
  for (const row of data) console.log(line(row));
}

const totals = rows.reduce(
  (acc, r) => ({
    total: acc.total + r.total,
    confirmado: acc.confirmado + r.confirmado,
    roto: acc.roto + r.roto,
    noConstruido: acc.noConstruido + r.noConstruido,
    sinVeredicto: acc.sinVeredicto + r.sinVeredicto,
  }),
  { total: 0, confirmado: 0, roto: 0, noConstruido: 0, sinVeredicto: 0 },
);

console.log(
  `check-scenarios: ${results.length} stories bajo el gate, ${totals.total} escenarios.\n`,
);

printTable(
  ['Story', 'escenarios', 'confirmado', 'roto', 'no construido', 'sin veredicto'],
  rows.map((r) => [
    r.story,
    String(r.total),
    String(r.confirmado),
    String(r.roto),
    String(r.noConstruido),
    String(r.sinVeredicto),
  ]),
);

if (findings.length > 0) {
  console.log('\nOtros hallazgos:');
  for (const f of findings) {
    console.log(`  ${f.file}${f.line ? `:${f.line}` : ''} [${f.rule}] ${f.detail}`);
  }
}

if (rotoList.length > 0) {
  console.log('\nEscenarios roto:');
  for (const rt of rotoList) {
    console.log(`  ${rt.storyId} ${rt.scenarioId} roto: #${rt.issue}`);
  }
}

if (sinVeredictoList.length > 0) {
  console.log('\nEscenarios sin veredicto:');
  for (const s of sinVeredictoList) {
    console.log(`  ${s.file}:${s.line} ${s.storyId} ${s.scenarioId}`);
  }
}

if (citaSinEscenario.length > 0) {
  console.log('\nCitas sin escenario:');
  for (const c of citaSinEscenario) {
    console.log(
      `  ${c.file}:${c.line} cita ${c.storyId} ${c.scenarioId}, que no existe en su scenarios.md`,
    );
  }
}

console.log(
  `\nTotal: ${totals.total} escenarios en ${results.length} stories. confirmado ${totals.confirmado}, roto ${totals.roto}, no construido ${totals.noConstruido}, sin veredicto ${totals.sinVeredicto}. Citas sin escenario: ${citaSinEscenario.length}. Otros hallazgos: ${findings.length}.`,
);

const GATING_RULES = [
  'story-sin-scenarios',
  'story-sin-escenarios',
  'story-duplicada',
  'escenario-repetido',
  'fila-sin-id',
  'id-repetido',
  'marca-caduca',
  'marca-mal-escrita',
  'fence-sin-cerrar',
];
const gatingFindings = findings.filter((f) => GATING_RULES.includes(f.rule)).length;
const shouldFail =
  STRICT && (totals.sinVeredicto > 0 || citaSinEscenario.length > 0 || gatingFindings > 0);
process.exit(shouldFail ? 1 : 0);
