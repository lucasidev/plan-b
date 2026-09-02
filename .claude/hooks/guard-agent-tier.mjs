#!/usr/bin/env node

// PreToolUse hook (Agent, Task). Aplica en cualquier contexto, también dentro de un subagente.
//
// Invariante: un subagente sin tipo del proyecto hereda el modelo de la sesión, el tier más caro.
// Los agentes de `.claude/agents/` traen su modelo en el frontmatter y ese manda: un `model`
// que lo pise no pasa. Un built-in (Explore, Plan, claude-code-guide) pasa solo con `model`
// haiku o sonnet. `general-purpose`, `fork` y sin tipo no pasan nunca.
// Si el roster no se puede leer, deja pasar todo lo demás: fallar cerrado dejaría sin
// test-runner, y sin test-runner no hay forma de correr las suites.
// Escape por sesión: PLANB_GUARD_OFF=1.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

if (process.env.PLANB_GUARD_OFF === '1') {
  process.exit(0);
}

const toolInput = input?.tool_input ?? {};
const type = typeof toolInput.subagent_type === 'string' ? toolInput.subagent_type.trim() : '';
const model = typeof toolInput.model === 'string' ? toolInput.model.trim() : '';

function deny(reason) {
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

// `.claude/agents` se busca por CLAUDE_PROJECT_DIR y, si no está, subiendo desde el cwd.
function findAgentsDir() {
  const candidates = [];
  if (process.env.CLAUDE_PROJECT_DIR) candidates.push(process.env.CLAUDE_PROJECT_DIR);
  let dir = resolve(typeof input?.cwd === 'string' && input.cwd !== '' ? input.cwd : process.cwd());
  for (let i = 0; i < 12; i += 1) {
    candidates.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const c of candidates) {
    const d = join(c, '.claude', 'agents');
    if (existsSync(d)) return d;
  }
  return null;
}

// name -> modelo del frontmatter (o '' si no fija uno). El tipo del subagente es el `name:` del
// frontmatter, que en este repo coincide con el archivo.
function readRoster(dir) {
  const roster = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    let name = f.slice(0, -3);
    let agentModel = '';
    try {
      const text = readFileSync(join(dir, f), 'utf8');
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (fm) {
        const n = fm[1].match(/^name:\s*([^\s#]+)/m);
        const m = fm[1].match(/^model:\s*([^\s#]+)/m);
        if (n) name = n[1];
        if (m) agentModel = m[1];
      }
    } catch {
      // Un agente ilegible se lista sin modelo: pasa como built-in con model barato.
    }
    roster.set(name, agentModel);
  }
  return roster;
}

// Alias o id completo: haiku y sonnet son baratos; `inherit` y cualquier otra cosa no.
function isCheap(m) {
  const base = m.replace(/\[.*\]$/, '').toLowerCase();
  return /^(?:haiku|sonnet)$/.test(base) || /^claude-(?:haiku|sonnet)-/.test(base);
}
function sameModel(a, b) {
  const norm = (x) => x.replace(/\[.*\]$/, '').toLowerCase().replace(/^claude-/, '').split('-')[0];
  return norm(a) === norm(b);
}

if (type === '' || type === 'general-purpose' || type === 'fork') {
  deny(
    `Bloqueado: Agent con subagent_type "${type || 'ninguno'}" hereda el modelo de la sesión. ` +
      'Usá un agente del proyecto (.claude/agents): scout investiga, implementer construye, test-runner corre, reviewer revisa.',
  );
}

const agentsDir = findAgentsDir();
if (agentsDir === null) {
  process.exit(0);
}
let roster;
try {
  roster = readRoster(agentsDir);
} catch {
  process.exit(0);
}
const names = [...roster.keys()].join(', ');

if (roster.has(type)) {
  const fixed = roster.get(type);
  if (fixed !== '' && fixed !== 'inherit') {
    if (model !== '' && !sameModel(model, fixed)) {
      deny(
        `Bloqueado: "${type}" tiene model ${fixed} fijado en su frontmatter y la llamada lo pisa con "${model}". ` +
          'No pases model a un agente del proyecto: el frontmatter decide.',
      );
    }
    process.exit(0);
  }
}

if (!isCheap(model)) {
  deny(
    `Bloqueado: "${type}" sin model haiku o sonnet hereda el modelo de la sesión${model ? ` (pasaste "${model}")` : ''}. ` +
      `Pasá model: "sonnet" (o "haiku"), o usá un agente del proyecto: ${names}.`,
  );
}

process.exit(0);
