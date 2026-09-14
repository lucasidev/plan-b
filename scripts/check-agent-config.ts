#!/usr/bin/env bun
/**
 * Valida los adaptadores de agentes sin convertir uno en fuente del otro.
 *
 * - `.agents/skills/` es el catálogo que descubre Codex. Sus skills no pueden depender de
 *   rutas, frontmatter ni conceptos exclusivos de Claude Code.
 * - `.claude/skills/` es el catálogo nativo de Claude Code. Puede tener otros skills y otra
 *   implementación: no se compara ni se sincroniza con el de Codex.
 * - Los perfiles de subagente sí comparten su contrato de rol. Por eso cada par
 *   `.claude/agents/<name>.md` y `.codex/agents/<name>.toml` conserva el mismo nombre,
 *   descripción e instrucciones, aunque cada adaptador elija sus herramientas y su modelo.
 *
 * Señala por default y bloquea con `--strict`.
 *
 * Uso: bun scripts/check-agent-config.ts [--strict]
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

// Bun trae el parser TOML, pero scripts/tsconfig.json toma solo los tipos de Node.
declare const Bun: { TOML: { parse(text: string): unknown } };

interface AgentSpec {
  name: string;
  description: string;
  body: string;
}

interface SkillSpec {
  name: string;
  description: string;
}

const CODEX_SKILL_FORBIDDEN = [
  { pattern: /\bClaude Code\b/i, reason: 'menciona Claude Code' },
  { pattern: /\bAnthropic\b/i, reason: 'depende de material de Anthropic' },
  { pattern: /(?:^|[\\/])\.claude(?:[\\/]|$)/i, reason: 'referencia .claude/' },
  {
    pattern: /^\s*(?:disable-model-invocation|allowed-tools)\s*:/im,
    reason: 'usa frontmatter exclusivo de Claude Code',
  },
] as const;

function listFilesRecursive(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...listFilesRecursive(full, base));
    } else {
      files.push(relative(base, full).split(sep).join('/'));
    }
  }
  return files;
}

function stripYamlQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function parseSkill(content: string): SkillSpec {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') {
    throw new Error('el frontmatter no abre en la primera línea');
  }
  const closeIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closeIndex === -1) throw new Error('falta el cierre del frontmatter');

  const frontmatter = lines.slice(1, closeIndex);
  const nameLine = frontmatter.find((line) => /^name\s*:/.test(line));
  const descriptionIndex = frontmatter.findIndex((line) => /^description\s*:/.test(line));
  const name = stripYamlQuotes(nameLine?.slice(nameLine.indexOf(':') + 1).trim() ?? '');

  let description = '';
  if (descriptionIndex !== -1) {
    const descriptionLine = frontmatter[descriptionIndex] ?? '';
    const raw = descriptionLine.slice(descriptionLine.indexOf(':') + 1).trim();
    if (/^[>|][+-]?$/.test(raw)) {
      const continuation: string[] = [];
      for (const line of frontmatter.slice(descriptionIndex + 1)) {
        if (!/^\s+\S/.test(line)) break;
        continuation.push(line.trim());
      }
      description = continuation.join(' ').trim();
    } else {
      description = stripYamlQuotes(raw);
    }
  }

  return { name, description };
}

function checkSkillCatalog(root: string, catalog: '.agents' | '.claude'): string[] {
  const findings: string[] = [];
  const skillsDir = join(root, catalog, 'skills');
  if (!existsSync(skillsDir)) {
    return [`${catalog}/skills/: falta el catálogo`];
  }

  const entries = readdirSync(skillsDir).sort();
  const skillNames = entries.filter((name) => statSync(join(skillsDir, name)).isDirectory());
  if (skillNames.length === 0) findings.push(`${catalog}/skills/: no contiene ningún skill`);

  for (const folder of skillNames) {
    const skillPath = join(skillsDir, folder, 'SKILL.md');
    if (!existsSync(skillPath)) {
      findings.push(`${catalog}/skills/${folder}/SKILL.md: falta`);
      continue;
    }

    try {
      const skill = parseSkill(readFileSync(skillPath, 'utf-8'));
      if (skill.name !== folder) {
        findings.push(`${catalog}/skills/${folder}/SKILL.md: name debe ser ${folder}`);
      }
      if (skill.description === '') {
        findings.push(`${catalog}/skills/${folder}/SKILL.md: description está vacía`);
      }
    } catch (error) {
      findings.push(
        `${catalog}/skills/${folder}/SKILL.md: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (catalog === '.agents') {
    for (const file of listFilesRecursive(skillsDir)) {
      if (file === 'README.md') continue;
      const content = readFileSync(join(skillsDir, file), 'utf-8');
      const forbidden = CODEX_SKILL_FORBIDDEN.find(({ pattern }) => pattern.test(content));
      if (forbidden) findings.push(`.agents/skills/${file}: ${forbidden.reason}`);
    }
  }

  return findings;
}

export function checkSkills(root: string): string[] {
  return [...checkSkillCatalog(root, '.agents'), ...checkSkillCatalog(root, '.claude')];
}

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

function shortMessage(error: unknown): string {
  const message =
    error &&
    typeof error === 'object' &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : String(error);
  return message.split('\n')[0] ?? message;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

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
  const claudeNameSet = new Set(claudeNames);
  const codexNameSet = new Set(codexNames);

  for (const name of new Set([...claudeNames, ...codexNames])) {
    if (!claudeNameSet.has(name)) {
      findings.push(`.claude/agents/${name}.md: falta`);
      continue;
    }
    if (!codexNameSet.has(name)) {
      findings.push(`.codex/agents/${name}.toml: falta`);
      continue;
    }

    let markdown: AgentSpec;
    try {
      markdown = parseMarkdownAgent(readFileSync(join(claudeDir, `${name}.md`), 'utf-8'));
    } catch {
      findings.push(`.claude/agents/${name}.md: frontmatter mal formado`);
      continue;
    }

    let toml: AgentSpec;
    try {
      toml = parseCodexAgent(readFileSync(join(codexDir, `${name}.toml`), 'utf-8'));
    } catch (error) {
      findings.push(`.codex/agents/${name}.toml: TOML inválido: ${shortMessage(error)}`);
      continue;
    }

    if (markdown.name.trim() !== toml.name.trim()) findings.push(`${name}: name difiere`);
    if (markdown.description.trim() !== toml.description.trim()) {
      findings.push(`${name}: description difiere`);
    }
    if (normalize(markdown.body) !== normalize(toml.body)) {
      findings.push(`${name}: cuerpo difiere de developer_instructions`);
    }
  }

  return findings;
}

function main(): void {
  const root = resolve(import.meta.dirname, '..');
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const unknownArgs = args.filter((arg) => arg !== '--strict');
  const findings = [
    ...unknownArgs.map((arg) => `${arg}: argumento no soportado`),
    ...checkSkills(root),
    ...checkAgents(root),
  ];

  for (const finding of findings) console.log(finding);
  console.log(findings.length === 0 ? 'agent config válida' : `${findings.length} hallazgos`);
  process.exit(strict && findings.length > 0 ? 1 : 0);
}

if (import.meta.main) main();
