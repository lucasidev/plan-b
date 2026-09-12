import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('./guard-tool-budget.mjs', import.meta.url));

function invoke(stateDir, input, env = {}) {
  const result = spawnSync(process.execPath, [hook], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, PLANB_TOOL_BUDGET_STATE_DIR: stateDir, ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function withState(run) {
  const stateDir = mkdtempSync(join(tmpdir(), 'planb-tool-budget-test-'));
  try {
    run(stateDir);
  } finally {
    rmSync(stateDir, { recursive: true, force: true });
  }
}

test('permite N llamadas browser y deniega N+1', () => withState((stateDir) => {
  const input = { session_id: 'browser-session', tool_name: 'mcp__playwright__browser_navigate' };
  for (let index = 0; index < 2; index += 1) {
    assert.equal(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '2' }), '');
  }
  const output = JSON.parse(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '2' }));
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
}));

test('mantiene el presupuesto web separado del browser', () => withState((stateDir) => {
  const browser = { session_id: 'shared-session', tool_name: 'mcp__playwright__browser_navigate' };
  const web = { session_id: 'shared-session', tool_name: 'WebSearch' };
  assert.equal(invoke(stateDir, browser, { PLANB_BROWSER_TOOL_LIMIT: '1' }), '');
  assert.equal(invoke(stateDir, web, { PLANB_WEB_TOOL_LIMIT: '1' }), '');
  assert.equal(JSON.parse(invoke(stateDir, browser, { PLANB_BROWSER_TOOL_LIMIT: '1' })).hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(JSON.parse(invoke(stateDir, web, { PLANB_WEB_TOOL_LIMIT: '1' })).hookSpecificOutput.permissionDecision, 'deny');
}));

test('deja pasar una herramienta irrelevante', () => withState((stateDir) => {
  assert.equal(invoke(stateDir, { session_id: 'irrelevant-session', tool_name: 'Read' }), '');
}));

test('el escape desactiva el presupuesto', () => withState((stateDir) => {
  const input = { session_id: 'escape-session', tool_name: 'WebFetch' };
  assert.equal(invoke(stateDir, input, { PLANB_WEB_TOOL_LIMIT: '0', PLANB_TOOL_BUDGET_OFF: '1' }), '');
}));

test('aísla el estado por agente', () => withState((stateDir) => {
  const base = { session_id: 'shared-session', tool_name: 'WebSearch' };
  assert.equal(invoke(stateDir, { ...base, agent_id: 'agent-a' }, { PLANB_WEB_TOOL_LIMIT: '1' }), '');
  assert.equal(invoke(stateDir, { ...base, agent_id: 'agent-b' }, { PLANB_WEB_TOOL_LIMIT: '1' }), '');
  assert.equal(JSON.parse(invoke(stateDir, { ...base, agent_id: 'agent-a' }, { PLANB_WEB_TOOL_LIMIT: '1' })).hookSpecificOutput.permissionDecision, 'deny');
}));
