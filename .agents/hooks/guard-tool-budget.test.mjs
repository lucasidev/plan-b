import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('./guard-tool-budget.mjs', import.meta.url));
const clients = [
  { name: 'Codex', config: '../../.codex/hooks.json', browser: 'mcp__cua_repl__js', web: 'web__run' },
  { name: 'Claude', config: '../../.claude/settings.json', browser: 'mcp__playwright__browser_navigate', web: 'WebSearch' },
];

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

test('browser avisa cada N llamadas sin bloquear ni repetir el aviso entre intervalos', () => withState((stateDir) => {
  const input = { session_id: 'browser-session', tool_name: 'mcp__playwright__browser_navigate' };
  for (let used = 0; used < 7; used += 1) {
    const output = invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '2' });
    if (used > 0 && used % 2 === 0) {
      assert.deepEqual(JSON.parse(output), {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: assertBrowserReminder(output, used),
        },
      });
    } else {
      assert.equal(output, '');
    }
  }
}));

function assertBrowserReminder(output, used) {
  const parsed = JSON.parse(output);
  assert.equal(parsed.hookSpecificOutput.permissionDecision, undefined);
  assert.match(parsed.hookSpecificOutput.additionalContext, new RegExp(`${used} calls in this session`));
  return parsed.hookSpecificOutput.additionalContext;
}

for (const client of clients) {
  test(`${client.name}: browser recibe el aviso compartido sin bloquear`, () => withState((stateDir) => {
    const input = { session_id: 'client-session', tool_name: client.browser };
    assert.equal(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '1' }), '');
    assertBrowserReminder(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '1' }), 1);
  }));

  test(`${client.name}: su adaptador conecta browser y web al mismo guard compartido`, () => {
    const config = JSON.parse(readFileSync(new URL(client.config, import.meta.url), 'utf8'));
    const entries = config.hooks.PreToolUse.filter((entry) =>
      entry.hooks.some((handler) => handler.command?.includes('/.agents/hooks/guard-tool-budget.mjs')),
    );
    assert.equal(entries.length, 1);
    const matcher = new RegExp(entries[0].matcher);
    assert.equal(matcher.test(client.browser), true);
    assert.equal(matcher.test(client.web), true);
    assert.equal(matcher.test('mcp__codex_app__list_threads'), false);
  });
}

test('browser con umbral cero avisa desde el inicio sin bloquear', () => withState((stateDir) => {
  const input = { session_id: 'zero-session', tool_name: 'mcp__cua_repl__js' };
  assertBrowserReminder(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '0' }), 0);
  assertBrowserReminder(invoke(stateDir, input, { PLANB_BROWSER_TOOL_LIMIT: '0' }), 1);
}));

test('mantiene el presupuesto web separado del browser', () => withState((stateDir) => {
  const browser = { session_id: 'shared-session', tool_name: 'mcp__playwright__browser_navigate' };
  const web = { session_id: 'shared-session', tool_name: 'WebSearch' };
  assert.equal(invoke(stateDir, browser, { PLANB_BROWSER_TOOL_LIMIT: '1' }), '');
  assert.equal(invoke(stateDir, web, { PLANB_WEB_TOOL_LIMIT: '1' }), '');
  assertBrowserReminder(invoke(stateDir, browser, { PLANB_BROWSER_TOOL_LIMIT: '1' }), 1);
  assert.equal(JSON.parse(invoke(stateDir, web, { PLANB_WEB_TOOL_LIMIT: '1' })).hookSpecificOutput.permissionDecision, 'deny');
}));

test('cuenta las llamadas web de code mode en Codex', () => withState((stateDir) => {
  const input = { session_id: 'codex-web-session', tool_name: 'web__run' };
  assert.equal(invoke(stateDir, input, { PLANB_WEB_TOOL_LIMIT: '1' }), '');
  const output = JSON.parse(invoke(stateDir, input, { PLANB_WEB_TOOL_LIMIT: '1' }));
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
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
