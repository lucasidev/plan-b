import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { checkAgents, checkSkills } from './check-agent-config.ts';

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'check-agent-config-'));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function skill(name: string, description: string, body = 'Instrucciones propias.'): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n`;
}

function writeSkill(
  root: string,
  catalog: '.agents' | '.claude',
  name: string,
  content: string,
): void {
  write(join(root, catalog, 'skills', name, 'SKILL.md'), content);
}

function markdownAgent(name: string, description: string, body: string): string {
  return `---\nname: ${name}\ndescription: ${description}\nmodel: sonnet\n---\n${body}\n`;
}

function codexAgent(name: string, description: string, body: string): string {
  return `name = "${name}"\ndescription = "${description}"\nmodel = "gpt-5.6-luna"\ndeveloper_instructions = """\n${body}\n"""\n`;
}

test('los catálogos de skills pueden diferir', () =>
  fixture((root) => {
    writeSkill(root, '.agents', 'codex-only', skill('codex-only', 'Skill para Codex.'));
    writeSkill(root, '.claude', 'claude-only', skill('claude-only', 'Skill para Claude Code.'));

    assert.deepEqual(checkSkills(root), []);
  }));

test('cada cliente necesita su propio catálogo', () =>
  fixture((root) => {
    writeSkill(root, '.agents', 'demo', skill('demo', 'Skill de prueba.'));

    assert.deepEqual(checkSkills(root), ['.claude/skills/: falta el catálogo']);
  }));

test('cada directorio de skill necesita SKILL.md', () =>
  fixture((root) => {
    mkdirSync(join(root, '.agents', 'skills', 'vacío'), { recursive: true });
    writeSkill(root, '.claude', 'demo', skill('demo', 'Skill de prueba.'));

    assert.match(checkSkills(root).join('\n'), /.agents\/skills\/vacío\/SKILL.md: falta/);
  }));

test('el nombre del frontmatter coincide con el directorio', () =>
  fixture((root) => {
    writeSkill(root, '.agents', 'correcto', skill('otro', 'Skill de prueba.'));
    writeSkill(root, '.claude', 'demo', skill('demo', 'Skill de prueba.'));

    assert.match(checkSkills(root).join('\n'), /name debe ser correcto/);
  }));

test('un skill de Codex no depende de Claude Code', () =>
  fixture((root) => {
    writeSkill(
      root,
      '.agents',
      'demo',
      skill('demo', 'Skill de prueba.', 'Usá Claude Code para completar el trabajo.'),
    );
    writeSkill(root, '.claude', 'demo', skill('demo', 'Skill de prueba.'));

    assert.match(checkSkills(root).join('\n'), /menciona Claude Code/);
  }));

test('un skill nativo de Claude puede usar su frontmatter propio', () =>
  fixture((root) => {
    writeSkill(root, '.agents', 'demo', skill('demo', 'Skill de prueba.'));
    writeSkill(
      root,
      '.claude',
      'demo',
      `---\nname: demo\ndescription: Skill para Claude Code.\ndisable-model-invocation: true\n---\n`,
    );

    assert.deepEqual(checkSkills(root), []);
  }));

test('los perfiles comparten contrato aunque el modelo sea distinto', () =>
  fixture((root) => {
    const body = 'Investigá y devolvé evidencia.';
    write(
      join(root, '.claude', 'agents', 'researcher.md'),
      markdownAgent('researcher', 'Investiga.', body),
    );
    write(
      join(root, '.codex', 'agents', 'researcher.toml'),
      codexAgent('researcher', 'Investiga.', body),
    );

    assert.deepEqual(checkAgents(root), []);
  }));

test('un perfil con descripción o cuerpo distinto falla', () =>
  fixture((root) => {
    write(
      join(root, '.claude', 'agents', 'researcher.md'),
      markdownAgent('researcher', 'Investiga una cosa.', 'Cuerpo A.'),
    );
    write(
      join(root, '.codex', 'agents', 'researcher.toml'),
      codexAgent('researcher', 'Investiga otra cosa.', 'Cuerpo B.'),
    );

    const findings = checkAgents(root).join('\n');
    assert.match(findings, /description difiere/);
    assert.match(findings, /cuerpo difiere/);
  }));

test('un perfil sin contraparte falla', () =>
  fixture((root) => {
    write(
      join(root, '.claude', 'agents', 'researcher.md'),
      markdownAgent('researcher', 'Investiga.', 'Cuerpo.'),
    );

    assert.deepEqual(checkAgents(root), ['.codex/agents/researcher.toml: falta']);
  }));
