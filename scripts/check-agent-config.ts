#!/usr/bin/env bun
/**
 * Chequea que la configuración de agentes no driftee entre clientes.
 *
 * Dos checks independientes:
 *  A. Skills: `.agents/skills/` es el directorio canónico (estándar Agent Skills).
 *     `.claude/skills/` es una copia generada y gitignorada (Claude Code no lee `.agents/skills/`
 *     directo), que regenera `--sync`, a mano o vía el hook SessionStart y `just setup`. Si la
 *     copia no existe todavía no es drift, es un checkout sin generar (CI, clone fresco); si
 *     existe, toda diferencia con el canónico sí es drift. Única excepción: `.agents/skills/README.md`
 *     describe el directorio canónico para humanos y no hace falta que viva en la copia.
 *     `.claude/skills.overrides.json` (opcional) inyecta, solo en la copia de este cliente,
 *     claves de frontmatter que el skill canónico y agnóstico no lleva.
 *  B. Agentes: cada subagente vive por duplicado, `.claude/agents/<name>.md` (frontmatter YAML +
 *     cuerpo) y `.codex/agents/<name>.toml` (claves TOML + `developer_instructions`). El `name`,
 *     la `description` y el cuerpo tienen que decir lo mismo en los dos archivos.
 *
 * Señala, no bloquea: exit 0 siempre, salvo con --strict. `--sync` corrige el drift del check A
 * (copia el canónico sobre `.claude/skills/`, borra lo que sobra) y no imprime nada si no hubo
 * cambios, porque su stdout entra al contexto de Claude en cada arranque de sesión; el check B no
 * tiene autofix porque cada cliente necesita su propio formato de instrucciones, así que se edita
 * a mano en los dos archivos.
 *
 * Uso: bun scripts/check-agent-config.ts [--strict] [--sync]
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

// Bun 1.3.5 ya trae Bun.TOML.parse, pero scripts/tsconfig.json no incluye los tipos de Bun
// (typeRoots apunta a los @types de frontend, sin @types/bun). Declaración local mínima en vez
// de agregar el paquete o el tipo "bun" al tsconfig compartido por todo scripts/.
declare const Bun: { TOML: { parse(text: string): unknown } };

const README = 'README.md';

interface AgentSpec {
  name: string;
  description: string;
  body: string;
}

/** Lista, recursiva, los archivos de `dir` como paths relativos con `/` (no el separador del SO). */
function listFilesRecursive(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listFilesRecursive(full, base));
    } else {
      out.push(relative(base, full).split(sep).join('/'));
    }
  }
  return out;
}

const OVERRIDES_FILE = 'skills.overrides.json';

type SkillOverride = Record<string, string | boolean>;
type SkillOverrides = Record<string, SkillOverride>;

interface OverridesLoad {
  overrides: SkillOverrides;
  findings: string[];
  invalid: boolean;
}

/**
 * Carga `.claude/skills.overrides.json`: claves de frontmatter que este cliente necesita y el
 * skill canónico, agnóstico, no lleva. Ausente es el comportamiento de hoy (sin overrides).
 * Solo `string` o `boolean` son valores de frontmatter válidos: otro tipo (array, objeto, null,
 * número) queda afuera del override que se aplica, con su propio hallazgo.
 */
function loadOverrides(root: string): OverridesLoad {
  const path = join(root, '.claude', OVERRIDES_FILE);
  if (!existsSync(path)) {
    return { overrides: {}, findings: [], invalid: false };
  }

  let raw: Record<string, Record<string, unknown>>;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, Record<string, unknown>>;
  } catch {
    return { overrides: {}, findings: ['overrides: JSON inválido'], invalid: true };
  }

  const canonicalDir = join(root, '.agents', 'skills');
  const canonicalSkills = new Set(
    existsSync(canonicalDir)
      ? readdirSync(canonicalDir).filter((name) => statSync(join(canonicalDir, name)).isDirectory())
      : [],
  );

  const findings: string[] = [];
  const overrides: SkillOverrides = {};
  for (const [skill, values] of Object.entries(raw)) {
    if (!canonicalSkills.has(skill)) {
      findings.push(`overrides: skill inexistente ${skill}`);
      continue;
    }
    const validValues: SkillOverride = {};
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== 'string' && typeof value !== 'boolean') {
        findings.push(`overrides: ${skill}.${key} debe ser string o boolean`);
        continue;
      }
      validValues[key] = value;
    }
    overrides[skill] = validValues;
  }

  return { overrides, findings, invalid: false };
}

/**
 * Inserta las claves de `override` como líneas `clave: valor`, justo antes del `---` de cierre
 * del frontmatter. Exige que el frontmatter abra en la primera línea: sin eso no hay dónde
 * insertar sin arriesgar corromper el archivo, y `applied: false` señala que no se aplicó nada.
 */
function injectOverride(
  content: string,
  override: SkillOverride,
): { content: string; applied: boolean } {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return { content, applied: false };
  const closeIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closeIndex === -1) return { content, applied: false };

  const overrideLines = Object.entries(override).map(([key, value]) => `${key}: ${value}`);
  const result = [...lines.slice(0, closeIndex), ...overrideLines, ...lines.slice(closeIndex)].join(
    '\n',
  );
  return { content: result, applied: true };
}

/**
 * La copia esperada de un archivo del canónico: bytes idénticos, salvo `<skill>/SKILL.md` con
 * override, que lleva las claves inyectadas en el frontmatter. Si el skill con override no abre
 * con un frontmatter real, la copia esperada queda igual al canónico (sin la clave) y se señala.
 */
function expectedSkillBytes(
  canonicalDir: string,
  file: string,
  overrides: SkillOverrides,
): { bytes: Buffer; findings: string[] } {
  const bytes = readFileSync(join(canonicalDir, file));
  const skill = file.split('/')[0];
  const override = overrides[skill];
  if (!override || file !== `${skill}/SKILL.md`) return { bytes, findings: [] };

  const { content, applied } = injectOverride(bytes.toString('utf-8'), override);
  if (!applied) {
    return { bytes, findings: [`overrides: ${skill} sin frontmatter, no se puede aplicar`] };
  }
  return { bytes: Buffer.from(content), findings: [] };
}

/**
 * Check A: `.agents/skills/` (canónico, con los overrides de `.claude/skills.overrides.json`
 * aplicados) contra `.claude/skills/` (copia). Cada archivo del canónico tiene que existir en la
 * copia con bytes idénticos a la copia esperada, y la copia no puede tener archivos de más,
 * salvo el README del canónico, que puede vivir solo ahí.
 */
export function checkSkills(root: string): string[] {
  const canonicalDir = join(root, '.agents', 'skills');
  const copyDir = join(root, '.claude', 'skills');
  const { overrides, findings: overrideFindings } = loadOverrides(root);
  const findings: string[] = [...overrideFindings];

  if (!existsSync(copyDir)) {
    // Sin la copia generada no hay drift que señalar: es un checkout fresco (CI, clone sin `just setup`).
    return findings;
  }
  const canonicalFiles = new Set(listFilesRecursive(canonicalDir));
  const copyFiles = new Set(listFilesRecursive(copyDir));

  for (const file of canonicalFiles) {
    if (file === README) continue;
    if (!copyFiles.has(file)) {
      findings.push(`.agents/skills/${file}: falta en la copia`);
      continue;
    }
    const { bytes: expectedBytes, findings: expectedFindings } = expectedSkillBytes(
      canonicalDir,
      file,
      overrides,
    );
    findings.push(...expectedFindings);
    const copyBytes = readFileSync(join(copyDir, file));
    if (!expectedBytes.equals(copyBytes)) {
      findings.push(`.agents/skills/${file}: difiere del canónico`);
    }
  }

  for (const file of copyFiles) {
    if (!canonicalFiles.has(file)) {
      findings.push(`.claude/skills/${file}: sobra en la copia`);
    }
  }

  return findings;
}

export interface SyncResult {
  copied: string[];
  deleted: string[];
}

/** Borra recursivamente los directorios vacíos que quedaron dentro de `dir`, sin borrar `dir` mismo. */
function pruneEmptyDirs(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    pruneEmptyDirs(full);
    if (readdirSync(full).length === 0) {
      rmSync(full, { recursive: true });
    }
  }
}

/**
 * Sobreescribe `.claude/skills/` con la copia esperada de `.agents/skills/` (canónico más los
 * overrides de `.claude/skills.overrides.json`): copia lo que falta o difiere, borra lo que
 * sobra (y los directorios que quedan vacíos tras un rename). El README del canónico nunca se
 * copia (es la única excepción del check A), así que tampoco se lo fuerza a existir en la copia.
 * Devuelve solo lo que realmente cambió, para poder loguearlo sin ruido cuando no hay nada que
 * hacer. Con overrides inválidos, no toca nada: se arregla el JSON a mano antes de sincronizar.
 * Si `.claude/skills` es un symlink (o resuelve al propio canónico), tampoco escribe: no hay
 * forma de saber qué hay del otro lado y sobreescribirlo a ciegas.
 */
export function syncSkills(root: string): SyncResult {
  const canonicalDir = join(root, '.agents', 'skills');
  const copyDir = join(root, '.claude', 'skills');

  if (existsSync(copyDir)) {
    const isLinked =
      lstatSync(copyDir).isSymbolicLink() || resolve(copyDir) === resolve(canonicalDir);
    if (isLinked) {
      console.log('.claude/skills es un enlace: --sync no escribe');
      return { copied: [], deleted: [] };
    }
  }

  const { overrides, invalid } = loadOverrides(root);
  if (invalid) {
    return { copied: [], deleted: [] };
  }

  const canonicalFiles = listFilesRecursive(canonicalDir).filter((file) => file !== README);
  const canonicalSet = new Set(canonicalFiles);
  const copyFiles = new Set(listFilesRecursive(copyDir));

  const copied: string[] = [];
  const deleted: string[] = [];

  for (const file of canonicalFiles) {
    const target = join(copyDir, file);
    const { bytes: expectedBytes } = expectedSkillBytes(canonicalDir, file, overrides);
    const needsCopy = !copyFiles.has(file) || !expectedBytes.equals(readFileSync(target));
    if (!needsCopy) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, expectedBytes);
    copied.push(`.claude/skills/${file}`);
  }

  for (const file of copyFiles) {
    if (!canonicalSet.has(file)) {
      rmSync(join(copyDir, file));
      deleted.push(`.claude/skills/${file}`);
    }
  }

  if (deleted.length > 0) {
    pruneEmptyDirs(copyDir);
  }

  return { copied, deleted };
}

/** Saca las comillas (simples o dobles) que envuelven un valor YAML citado. No hace falta soportar comillas escapadas adentro. */
function stripYamlQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

/** Parsea a mano el frontmatter YAML de un agente `.claude/agents/<name>.md` (claves simples). */
function parseMarkdownAgent(content: string): AgentSpec {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const openIndex = lines.findIndex((line) => line.trim() === '---');
  const closeIndex = lines.findIndex((line, index) => index > openIndex && line.trim() === '---');
  if (openIndex === -1 || closeIndex === -1) {
    throw new Error('frontmatter mal formado: falta el bloque --- ... ---');
  }

  const frontmatter: Record<string, string> = {};
  for (const line of lines.slice(openIndex + 1, closeIndex)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    frontmatter[line.slice(0, colon).trim()] = stripYamlQuotes(line.slice(colon + 1).trim());
  }

  return {
    name: frontmatter.name ?? '',
    description: frontmatter.description ?? '',
    body: lines.slice(closeIndex + 1).join('\n'),
  };
}

/** Parsea `.codex/agents/<name>.toml` con el parser de TOML que trae Bun. */
function parseCodexAgent(content: string): AgentSpec {
  const parsed = Bun.TOML.parse(content) as {
    name?: string;
    description?: string;
    developer_instructions?: string;
  };
  return {
    name: parsed.name ?? '',
    description: parsed.description ?? '',
    body: parsed.developer_instructions ?? '',
  };
}

/** El mensaje corto de un error de parseo, para el hallazgo: primera línea, sin stack trace. */
function shortMessage(err: unknown): string {
  const message =
    err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string'
      ? (err as { message: string }).message
      : String(err);
  return message.split('\n')[0] ?? message;
}

/** CRLF a LF, sin espacios colgando por línea, trim global: así se comparan md y toml. */
function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

/**
 * Check B: cada `.claude/agents/<name>.md` tiene que tener su par `.codex/agents/<name>.toml`
 * (y viceversa), con el mismo `name`, la misma `description` y el mismo cuerpo.
 */
export function checkAgents(root: string): string[] {
  const findings: string[] = [];
  const claudeDir = join(root, '.claude', 'agents');
  const codexDir = join(root, '.codex', 'agents');

  const claudeNames = existsSync(claudeDir)
    ? readdirSync(claudeDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.slice(0, -'.md'.length))
    : [];
  const codexNames = existsSync(codexDir)
    ? readdirSync(codexDir)
        .filter((file) => file.endsWith('.toml'))
        .map((file) => file.slice(0, -'.toml'.length))
    : [];
  const codexNameSet = new Set(codexNames);
  const claudeNameSet = new Set(claudeNames);
  const allNames = new Set([...claudeNames, ...codexNames]);

  for (const name of allNames) {
    if (!claudeNameSet.has(name)) {
      findings.push(`.claude/agents/${name}.md: falta`);
      continue;
    }
    if (!codexNameSet.has(name)) {
      findings.push(`.codex/agents/${name}.toml: falta`);
      continue;
    }

    let md: AgentSpec;
    try {
      md = parseMarkdownAgent(readFileSync(join(claudeDir, `${name}.md`), 'utf-8'));
    } catch {
      findings.push(`.claude/agents/${name}.md: frontmatter mal formado`);
      continue;
    }

    let toml: AgentSpec;
    try {
      toml = parseCodexAgent(readFileSync(join(codexDir, `${name}.toml`), 'utf-8'));
    } catch (err) {
      findings.push(`.codex/agents/${name}.toml: TOML inválido: ${shortMessage(err)}`);
      continue;
    }

    if (md.name.trim() !== toml.name.trim()) {
      findings.push(`${name}: name difiere`);
    }
    if (md.description.trim() !== toml.description.trim()) {
      findings.push(`${name}: description difiere`);
    }
    if (normalize(md.body) !== normalize(toml.body)) {
      findings.push(`${name}: cuerpo difiere de developer_instructions`);
    }
  }

  return findings;
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const sync = args.includes('--sync');
  const copyDir = join(root, '.claude', 'skills');

  if (sync) {
    const { copied, deleted } = syncSkills(root);
    for (const file of copied) console.log(`sync: copiado ${file}`);
    for (const file of deleted) console.log(`sync: borrado ${file}`);
  } else if (!existsSync(copyDir)) {
    console.log(
      '.claude/skills/ ausente: corré `just sync-agent-config` para generar la copia que lee Claude Code',
    );
  }

  const skillFindings = checkSkills(root);
  const agentFindings = checkAgents(root);
  const findings = [...skillFindings, ...agentFindings];

  // Con --sync, stdout entra al contexto de Claude en cada arranque de sesión: si ya quedó todo
  // en sync (nada que copiar/borrar y sin hallazgos de agentes), no se imprime nada más.
  if (sync && findings.length === 0) {
    process.exit(0);
  }

  for (const finding of findings) {
    console.log(finding);
  }

  if (sync && agentFindings.length > 0) {
    console.log(
      '--sync no toca los agentes (.claude/agents + .codex/agents): esos hallazgos se editan a mano en los dos archivos.',
    );
  }

  console.log(findings.length === 0 ? 'agent config en sync' : `${findings.length} hallazgos`);
  process.exit(strict && findings.length > 0 ? 1 : 0);
}

if (import.meta.main) {
  main();
}
