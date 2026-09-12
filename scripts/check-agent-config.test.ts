import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkAgents, checkSkills, syncSkills } from './check-agent-config.ts';

const README_NAME = 'README.md';

function makeRoot(): string {
  return mkdtempSync(join(tmpdir(), 'check-agent-config-'));
}

function writeFile(path: string, content: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

/** Arma un `.agents/skills/<skill>/SKILL.md` y, opcionalmente, su copia idéntica en `.claude`. */
function seedSkill(
  root: string,
  skill: string,
  content: string,
  options: { copy?: boolean; copyContent?: string } = {},
): void {
  writeFile(join(root, '.agents', 'skills', skill, 'SKILL.md'), content);
  if (options.copy !== false) {
    writeFile(join(root, '.claude', 'skills', skill, 'SKILL.md'), options.copyContent ?? content);
  }
}

function agentMd(name: string, description: string, body: string): string {
  return `---\nname: ${name}\ndescription: ${description}\ntools: Read\nmodel: haiku\n---\n${body}`;
}

function agentToml(name: string, description: string, body: string): string {
  return `name = "${name}"\ndescription = "${description}"\nmodel = "x"\ndeveloper_instructions = """\n${body}"""`;
}

function seedAgent(
  root: string,
  name: string,
  options: {
    mdName?: string;
    mdDescription?: string;
    mdBody?: string;
    tomlName?: string;
    tomlDescription?: string;
    tomlBody?: string;
    skipMd?: boolean;
    skipToml?: boolean;
  } = {},
): void {
  const mdName = options.mdName ?? name;
  const description = options.mdDescription ?? 'una descripción';
  const body = options.mdBody ?? 'Cuerpo del agente.\nSegunda línea.\n';
  const tomlName = options.tomlName ?? mdName;
  const tomlDescription = options.tomlDescription ?? description;
  const tomlBody = options.tomlBody ?? body;

  if (!options.skipMd) {
    writeFile(join(root, '.claude', 'agents', `${name}.md`), agentMd(mdName, description, body));
  }
  if (!options.skipToml) {
    writeFile(
      join(root, '.codex', 'agents', `${name}.toml`),
      agentToml(tomlName, tomlDescription, tomlBody),
    );
  }
}

test('copia idéntica: cero hallazgos en check A', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido igual\n');

  assert.deepEqual(checkSkills(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('un byte distinto en la copia produce un hallazgo "difiere"', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido original\n', { copyContent: 'contenido original!\n' });

  const findings = checkSkills(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /difiere del canónico/);
  rmSync(root, { recursive: true, force: true });
});

test('archivo extra en la copia produce un hallazgo "sobra"', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n');
  writeFile(join(root, '.claude', 'skills', 'demo', 'extra.md'), 'de más\n');

  const findings = checkSkills(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /sobra en la copia/);
  rmSync(root, { recursive: true, force: true });
});

test('archivo faltante en la copia produce un hallazgo "falta"', () => {
  const root = makeRoot();
  // La copia tiene que existir (con otro skill) para que "falta" no se confunda con el caso de
  // checkout sin generar: ese es cero hallazgos, no un hallazgo por archivo.
  seedSkill(root, 'existe', 'contenido\n');
  seedSkill(root, 'demo', 'contenido\n', { copy: false });

  const findings = checkSkills(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /falta en la copia/);
  rmSync(root, { recursive: true, force: true });
});

test('.claude/skills/ ausente (checkout sin generar la copia): cero hallazgos en check A', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n', { copy: false });

  assert.deepEqual(checkSkills(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('README.md solo en el canónico no produce hallazgos', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n');
  writeFile(join(root, '.agents', 'skills', 'README.md'), 'índice del directorio canónico\n');

  assert.deepEqual(checkSkills(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('un override de skills.overrides.json se inyecta en la copia y el check A queda en cero', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', '---\nname: demo\ndescription: algo\n---\ncuerpo\n', { copy: false });
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ demo: { 'disable-model-invocation': true } }),
  );

  syncSkills(root);

  const copy = readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8');
  assert.match(copy, /disable-model-invocation: true/);
  assert.deepEqual(checkSkills(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('una copia sin el override que pide skills.overrides.json produce "difiere"', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', '---\nname: demo\ndescription: algo\n---\ncuerpo\n');
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ demo: { 'disable-model-invocation': true } }),
  );

  const findings = checkSkills(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /difiere del canónico/);
  rmSync(root, { recursive: true, force: true });
});

test('un override para un skill que no existe en el canónico produce un hallazgo', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n');
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ fantasma: { 'disable-model-invocation': true } }),
  );

  const findings = checkSkills(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /overrides: skill inexistente fantasma/);
  rmSync(root, { recursive: true, force: true });
});

test('un valor de override que no es string ni boolean produce un hallazgo y no se aplica', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', '---\nname: demo\ndescription: algo\n---\ncuerpo\n', { copy: false });
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ demo: { 'lista-mala': [1, 2, 3] } }),
  );

  const findings = checkSkills(root);
  assert.match(findings.join('\n'), /overrides: demo\.lista-mala debe ser string o boolean/);

  syncSkills(root);
  const copy = readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8');
  assert.equal(copy.includes('lista-mala'), false);
  rmSync(root, { recursive: true, force: true });
});

test('un override sobre un SKILL.md sin frontmatter en la primera línea produce un hallazgo y no se inyecta', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'texto suelto antes\n---\nmedio\n---\ncuerpo\n');
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ demo: { 'disable-model-invocation': true } }),
  );

  const findings = checkSkills(root);
  assert.match(findings.join('\n'), /overrides: demo sin frontmatter, no se puede aplicar/);
  assert.doesNotMatch(findings.join('\n'), /difiere del canónico/);
  rmSync(root, { recursive: true, force: true });
});

test('un SKILL.md con --- en el cuerpo pero sin frontmatter no recibe la clave inyectada', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'texto suelto antes\n---\nmedio\n---\ncuerpo\n', { copy: false });
  writeFile(
    join(root, '.claude', 'skills.overrides.json'),
    JSON.stringify({ demo: { 'disable-model-invocation': true } }),
  );

  syncSkills(root);

  const copy = readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8');
  assert.equal(copy.includes('disable-model-invocation'), false);
  rmSync(root, { recursive: true, force: true });
});

test('un JSON inválido en skills.overrides.json produce un hallazgo y --sync no toca la copia', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido nuevo\n', { copyContent: 'contenido viejo\n' });
  writeFile(join(root, '.claude', 'skills.overrides.json'), '{ esto no es json');

  const findings = checkSkills(root);
  assert.match(findings.join('\n'), /overrides: JSON inválido/);

  const result = syncSkills(root);
  assert.deepEqual(result, { copied: [], deleted: [] });
  assert.equal(
    readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8'),
    'contenido viejo\n',
  );
  rmSync(root, { recursive: true, force: true });
});

test('md y toml con misma description y cuerpos iguales salvo CRLF y espacios finales: cero hallazgos', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', {
    mdBody: 'Línea uno.   \r\nLínea dos.\n',
    tomlBody: 'Línea uno.\nLínea dos.   ',
  });

  assert.deepEqual(checkAgents(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('description distinta produce un hallazgo', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', { mdDescription: 'una cosa', tomlDescription: 'otra cosa' });

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /description difiere/);
  rmSync(root, { recursive: true, force: true });
});

test('cuerpo distinto produce un hallazgo', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', { mdBody: 'Cuerpo A.\n', tomlBody: 'Cuerpo B.\n' });

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /cuerpo difiere de developer_instructions/);
  rmSync(root, { recursive: true, force: true });
});

test('name distinto produce un hallazgo', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', { tomlName: 'otro-nombre' });

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /name difiere/);
  rmSync(root, { recursive: true, force: true });
});

test('toml faltante produce un hallazgo', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', { skipToml: true });

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /\.codex\/agents\/demo\.toml: falta/);
  rmSync(root, { recursive: true, force: true });
});

test('md faltante produce un hallazgo', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', { skipMd: true });

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /\.claude\/agents\/demo\.md: falta/);
  rmSync(root, { recursive: true, force: true });
});

test('un md sin frontmatter produce un hallazgo y no lanza', () => {
  const root = makeRoot();
  writeFile(join(root, '.claude', 'agents', 'demo.md'), 'sin frontmatter acá\n');
  writeFile(
    join(root, '.codex', 'agents', 'demo.toml'),
    agentToml('demo', 'una descripción', 'cuerpo\n'),
  );

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /\.claude\/agents\/demo\.md: frontmatter mal formado/);
  rmSync(root, { recursive: true, force: true });
});

test('un toml con sintaxis inválida produce un hallazgo con el mensaje corto y no lanza', () => {
  const root = makeRoot();
  seedAgent(root, 'demo');
  // un string sin cerrar: TOML inválido
  writeFile(join(root, '.codex', 'agents', 'demo.toml'), 'name = "demo\n');

  const findings = checkAgents(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0] ?? '', /\.codex\/agents\/demo\.toml: TOML inválido: .+/);
  rmSync(root, { recursive: true, force: true });
});

test('description entrecomillada en el md compara igual contra la description sin comillas del toml', () => {
  const root = makeRoot();
  seedAgent(root, 'demo', {
    mdDescription: '"Hace X: y Z."',
    tomlDescription: 'Hace X: y Z.',
  });

  assert.deepEqual(checkAgents(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('--sync deja la copia idéntica al canónico, borra el sobrante y no toca el README', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido nuevo\n', { copyContent: 'contenido viejo\n' });
  writeFile(join(root, '.agents', 'skills', 'nuevo', 'SKILL.md'), 'skill que faltaba\n');
  writeFile(join(root, '.claude', 'skills', 'demo', 'sobrante.md'), 'esto no debería sobrevivir\n');
  writeFile(join(root, '.agents', 'skills', README_NAME), 'índice del canónico\n');

  syncSkills(root);

  assert.equal(
    readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8'),
    'contenido nuevo\n',
  );
  assert.equal(
    readFileSync(join(root, '.claude', 'skills', 'nuevo', 'SKILL.md'), 'utf-8'),
    'skill que faltaba\n',
  );
  assert.equal(existsSync(join(root, '.claude', 'skills', 'demo', 'sobrante.md')), false);
  assert.equal(existsSync(join(root, '.claude', 'skills', 'README.md')), false);
  assert.deepEqual(checkSkills(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('--sync sobre la copia ausente la crea completa', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n', { copy: false });
  writeFile(join(root, '.agents', 'skills', README_NAME), 'índice del canónico\n');

  const result = syncSkills(root);

  assert.equal(
    readFileSync(join(root, '.claude', 'skills', 'demo', 'SKILL.md'), 'utf-8'),
    'contenido\n',
  );
  assert.equal(existsSync(join(root, '.claude', 'skills', README_NAME)), false);
  assert.deepEqual(checkSkills(root), []);
  assert.deepEqual(result, { copied: ['.claude/skills/demo/SKILL.md'], deleted: [] });
  rmSync(root, { recursive: true, force: true });
});

test('--sync sin cambios no copia ni borra nada (así se sostiene el silencio en stdout)', () => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido\n');

  const result = syncSkills(root);

  assert.deepEqual(result, { copied: [], deleted: [] });
  rmSync(root, { recursive: true, force: true });
});

test('renombrar un skill en el canónico y sincronizar no deja el directorio viejo vacío', () => {
  const root = makeRoot();
  seedSkill(root, 'nombre-viejo', 'contenido\n');
  // simula el rename: el canónico ya tiene el nombre nuevo, la copia todavía el viejo
  rmSync(join(root, '.agents', 'skills', 'nombre-viejo'), { recursive: true, force: true });
  writeFile(join(root, '.agents', 'skills', 'nombre-nuevo', 'SKILL.md'), 'contenido\n');

  syncSkills(root);

  assert.equal(existsSync(join(root, '.claude', 'skills', 'nombre-viejo')), false);
  assert.equal(
    readFileSync(join(root, '.claude', 'skills', 'nombre-nuevo', 'SKILL.md'), 'utf-8'),
    'contenido\n',
  );
  rmSync(root, { recursive: true, force: true });
});

test('--sync no escribe si .claude/skills es un symlink', (t) => {
  const root = makeRoot();
  seedSkill(root, 'demo', 'contenido nuevo\n', { copy: false });
  const target = join(root, 'target-real');
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'marker.txt'), 'no tocar\n');

  const copyDir = join(root, '.claude', 'skills');
  mkdirSync(join(root, '.claude'), { recursive: true });
  try {
    symlinkSync(target, copyDir, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (err) {
    rmSync(root, { recursive: true, force: true });
    t.skip(`no se pudo crear un symlink en este entorno: ${(err as Error).message}`);
    return;
  }

  const result = syncSkills(root);

  assert.deepEqual(result, { copied: [], deleted: [] });
  assert.equal(existsSync(join(target, 'marker.txt')), true);
  assert.equal(existsSync(join(target, 'demo')), false);
  // borra el enlace, no lo que apunta: rmSync recursivo sobre un junction de Windows falla (EFAULT)
  rmdirSync(copyDir);
  rmSync(root, { recursive: true, force: true });
});
