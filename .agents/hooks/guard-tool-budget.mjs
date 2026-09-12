#!/usr/bin/env node

// Este guard comparte presupuesto entre llamadas de una misma sesión y, si existe, subagente.
// Ante input o estado ilegible deja pasar para no bloquear una herramienta por fallas del guard.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

if (process.env.PLANB_TOOL_BUDGET_OFF === '1') {
  process.exit(0);
}

const toolName = typeof input?.tool_name === 'string' ? input.tool_name : '';
const sessionId = typeof input?.session_id === 'string' ? input.session_id : '';
const agentId = typeof input?.agent_id === 'string' ? input.agent_id : '';

function categoryFor(name) {
  if (/(?:playwright|chrome|browser)/i.test(name)) return 'browser';
  if (name === 'WebSearch' || name === 'WebFetch') return 'web';
  return null;
}

function readLimit(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

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
}

const category = categoryFor(toolName);
if (category === null || sessionId === '') {
  process.exit(0);
}

const limit = category === 'browser'
  ? readLimit('PLANB_BROWSER_TOOL_LIMIT', 12)
  : readLimit('PLANB_WEB_TOOL_LIMIT', 6);
const stateDir = process.env.PLANB_TOOL_BUDGET_STATE_DIR || join(tmpdir(), 'planb-tool-budget');
const scope = `${sessionId}\n${agentId}`;
const fileName = `${category}-${createHash('sha256').update(scope).digest('hex')}.count`;

try {
  mkdirSync(stateDir, { recursive: true });
  const file = join(stateDir, fileName);
  let used = 0;
  try {
    const stored = Number.parseInt(readFileSync(file, 'utf8'), 10);
    if (Number.isInteger(stored) && stored >= 0) used = stored;
  } catch (error) {
    // Un contador inexistente empieza en cero; otro error deja pasar para fallar abierto.
    if (error?.code !== 'ENOENT') throw error;
  }

  if (used >= limit) {
    deny(`Tool budget exhausted: ${category} ${used}/${limit} for this session.`);
    process.exit(0);
  }

  writeFileSync(file, String(used + 1), 'utf8');
} catch {
  process.exit(0);
}
