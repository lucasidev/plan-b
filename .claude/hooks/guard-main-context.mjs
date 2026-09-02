#!/usr/bin/env node

// PreToolUse hook (Bash, Edit, Write, MultiEdit, NotebookEdit).
//
// Invariante: el contexto principal orquesta; no corre suites ni escribe código más allá de un
// arreglo quirúrgico. Las suites las corre `test-runner` y el código lo escribe `implementer`
// desde un spec ("Reparto del trabajo" en CLAUDE.md). Dentro de un subagente el hook no
// interviene: Claude Code manda `agent_id` en el input cuando el tool call ocurre ahí, y ese
// contexto es descartable.
//
// Salida: `permissionDecision: deny` bloquea; `additionalContext` avisa sin bloquear. Ante la
// duda (stdin ilegible, sin session_id, estado inaccesible) deja pasar.
// Escape por sesión: PLANB_GUARD_OFF=1. Topes: PLANB_GUARD_EDIT_NUDGE (8) y
// PLANB_GUARD_EDIT_DENY (20) escrituras de código por sesión en el contexto principal.

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const STATE_DIR = join(tmpdir(), 'planb-guard');
const tool = input?.tool_name ?? '';
const toolInput = input?.tool_input ?? {};
const sessionId =
  typeof input?.session_id === 'string' && /^[\w.-]+$/.test(input.session_id) ? input.session_id : null;

function log(decision, detail) {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    const oneLine = String(detail).replace(/\s+/g, ' ').slice(0, 120);
    appendFileSync(
      join(STATE_DIR, 'log.txt'),
      `${new Date().toISOString()}\t${sessionId ?? '?'}\t${input?.agent_type ?? 'main'}\t${tool}\t${decision}\t${oneLine}\n`,
    );
  } catch {
    // El log es diagnóstico; nunca frena el hook.
  }
}

function deny(reason) {
  log('deny', reason);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function nudge(text) {
  log('nudge', text);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text },
    }),
  );
  process.exit(0);
}

if (process.env.PLANB_GUARD_OFF === '1') {
  process.exit(0);
}
if (input?.agent_id) {
  log('pass', `subagente ${input?.agent_type ?? '?'}`);
  process.exit(0);
}

// Un tope mal escrito ("", "off", un typo) vuelve al default: nunca 0 ni NaN.
function readLimit(name, fallback) {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
const NUDGE = readLimit('PLANB_GUARD_EDIT_NUDGE', 8);
const DENY = readLimit('PLANB_GUARD_EDIT_DENY', 20);

// Archivo de código: lo que construye el producto, incluidos los E2E. Config y docs no.
const CODE_FILE = /(?:backend|frontend\/(?:src|e2e)|scripts)\/[^\s"'<>|;&]*\.(?:cs|ts|tsx|js|jsx|mjs|cjs|css|sql)\b/;

// Contador por sesión: una línea por escritura, en append, así un lote de ediciones en paralelo
// no se pisa (con un JSON leído y reescrito se perdían la mitad).
function editsSoFar() {
  try {
    return readFileSync(join(STATE_DIR, `${sessionId}.edits`), 'utf8').split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}
function recordEdit(what) {
  // Una línea por escritura: el detalle se aplana, o un heredoc de 40 líneas contaría 40.
  const oneLine = String(what).replace(/\s+/g, ' ').slice(0, 80);
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    appendFileSync(join(STATE_DIR, `${sessionId}.edits`), `${oneLine}\n`);
  } catch {
    // Sin estado no hay conteo; el hook no frena por eso.
  }
}
function budget(what) {
  if (!sessionId) return;
  const edits = editsSoFar();
  if (edits >= DENY) {
    deny(
      `Bloqueado: ${edits} escrituras de código en el contexto principal en esta sesión (tope ${DENY}). ` +
        'Esto es construcción, no un arreglo quirúrgico: escribí el spec (qué, dónde, contrato, criterio de éxito) ' +
        'y delegá a implementer con Agent({ subagent_type: "implementer", prompt: "<spec>" }). ' +
        'Si de verdad es un arreglo puntual, el usuario puede subir el tope con PLANB_GUARD_EDIT_DENY.',
    );
  }
  recordEdit(what);
  const now = edits + 1;
  if (now >= NUDGE) {
    nudge(
      `Guard: ${now} escrituras de código en el contexto principal en esta sesión (bloquea a las ${DENY}). ` +
        'Si esto es más que un arreglo quirúrgico, pará acá, escribí el spec y delegá a implementer.',
    );
  }
}

if (tool === 'Bash') {
  const command = String(toolInput.command ?? '');

  // Runners de suites, en posición de comando (inicio de línea o después de ; & | ( $( then do),
  // con prefijos habituales (VAR=1, timeout, time, env, nice, nohup, exec).
  const RUNNER = String.raw`(?:dotnet\s+(?:test|vstest)\b|dotnet-coverage\s+collect\b|(?:bunx?|npx|pnpm|yarn)\s+(?:run\s+)?(?:playwright\s+test|vitest|test)\b|npm\s+(?:run\s+)?test\b|(?:[^\s;&|(]*node_modules/\.bin/)?(?:vitest\b|playwright\s+test\b)|just\s+(?:(?:-f|--justfile)\s+\S+\s+)?(?:test|ci|frontend-test\S*|backend-test\S*)\b)`;
  const PREFIX = String.raw`(?:(?:\w+=\S*|timeout\s+(?:-\S+\s+)*\S+|time|env|nice|nohup|exec)\s+)*`;
  const SUITE = new RegExp(String.raw`(?:^|[;&|(\n]|\$\(|\bthen\b|\bdo\b)\s*${PREFIX}(${RUNNER})`, 'm');

  // Lo entre comillas es prosa (un body de PR, un mensaje de commit, un echo) salvo que sea el
  // argumento de `sh -c`, `bash -c` o `pwsh -Command`: eso es un comando y se mira aparte.
  function stripQuoted(cmd) {
    return cmd
      .replace(/<<-?\s*(["']?)(\w+)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, '<<HEREDOC')
      .replace(/"(?:[^"\\]|\\[\s\S])*"/g, '""')
      .replace(/'[^']*'/g, "''");
  }
  function innerShellCommands(cmd) {
    const found = [];
    const re = /\b(?:sh|bash|zsh|dash|pwsh|powershell)(?:\.exe)?\s+(?:-[a-zA-Z]+\s+)*(?:-c|-lc|-ec|-Command|-command)\s+(["'])([\s\S]*?)\1/g;
    let m;
    while ((m = re.exec(cmd)) !== null) found.push(m[2]);
    return found;
  }
  function runsSuite(cmd) {
    const m = stripQuoted(cmd).match(SUITE);
    if (m) return m[1];
    for (const inner of innerShellCommands(cmd)) {
      const r = runsSuite(inner);
      if (r) return r;
    }
    return null;
  }

  const runner = runsSuite(command);
  if (runner) {
    deny(
      `Bloqueado: "${runner.replace(/\s+/g, ' ')}" corre una suite en el contexto principal. ` +
        'Delegá a test-runner: Agent({ subagent_type: "test-runner", prompt: "<comando exacto y qué verificar>" }) ' +
        'y trabajá con verde/rojo más las líneas de falla que devuelve.',
    );
  }

  // Escribir código por la shell (heredoc, sed -i, tee, un script de Python o Node que abre
  // un archivo para escribir) cuenta igual que un Edit: es la misma construcción por otra puerta.
  const REDIRECT_TO_CODE = new RegExp(
    String.raw`(?:>>?|\btee\b(?:\s+-a)?)\s*["']?(?:[^\s"'<>|;&]*/)?` + CODE_FILE.source,
  );
  const IN_PLACE_ON_CODE = new RegExp(
    String.raw`\b(?:sed\s+-i|perl\s+-p?i|git\s+apply|patch|cp|mv|git\s+mv|Set-Content|Out-File)\b[^\n;&|]*` + CODE_FILE.source,
  );
  const SCRIPT_WRITES = /\b(?:python3?|node|bun)\b[\s\S]*(?:open\([^)]*["'][wa]|write_text\(|writeFileSync\(|writeFile\(|Set-Content|Out-File)/;
  if (REDIRECT_TO_CODE.test(command) || IN_PLACE_ON_CODE.test(command) || (SCRIPT_WRITES.test(command) && CODE_FILE.test(command))) {
    budget(`bash:${command.slice(0, 60)}`);
  }

  log('allow', command);
  process.exit(0);
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
if (!EDIT_TOOLS.has(tool)) {
  process.exit(0);
}

const file = String(toolInput.file_path ?? toolInput.notebook_path ?? '').replace(/\\/g, '/');
if (!CODE_FILE.test(file) || /\/\.claude\//.test(file)) {
  process.exit(0);
}

budget(`${tool}:${file.slice(-60)}`);
log('allow', file);
process.exit(0);
