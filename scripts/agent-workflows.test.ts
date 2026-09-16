import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflows = ['deep-review', 'doc-drift', 'security-audit', 'test-gaps'];
const finding = {
  file: 'backend/example.cs',
  line: 10,
  severity: 'high',
  summary: 'Missing check',
  trigger: 'A specific invalid request',
};
type Call = { prompt: string; options: { agentType: string; model: string; effort: string } };
type Result = {
  status: string;
  target?: string;
  scope?: string;
  confirmed: unknown[];
  refuted: unknown[];
  unverified: unknown[];
  unreviewed: string[];
  stats?: { raw: number; unique: number; agents: number };
};

async function execute(name: string, replies: unknown[], args?: unknown) {
  const source = readFileSync(resolve('.claude/workflows', `${name}.js`), 'utf8');
  const calls: Call[] = [];
  let active = 0;
  let maxActive = 0;
  const agent = async (prompt: string, options: Call['options']) => {
    const index = calls.length;
    calls.push({ prompt, options });
    active++;
    maxActive = Math.max(maxActive, active);
    await Promise.resolve();
    active--;
    const reply = replies[index];
    if (reply instanceof Error) throw reply;
    return reply;
  };
  // El runtime nativo inyecta args/agent/log y permite return en el cuerpo del workflow.
  const run = new Function(
    'args',
    'agent',
    'log',
    `return (async () => {${source.replace('export const meta', 'const meta')}\n})()`,
  );
  const result: Result = await run(args, agent, () => {});
  return { result, calls, maxActive };
}

for (const workflow of workflows) {
  test(`${workflow}: deduplica sin rebajar severidad ni mezclar casos distintos`, async () => {
    const { result, calls } = await execute(workflow, [
      {
        findings: [
          finding,
          { ...finding, severity: 'low' },
          { ...finding, trigger: 'another request' },
        ],
        unreviewed: [],
      },
      {
        verdicts: [
          { id: 0, status: 'confirmed', evidence: 'x:1' },
          { id: 1, status: 'unverified', evidence: 'Needs runtime evidence at x:2' },
        ],
      },
    ]);
    const batch = JSON.parse(calls[1].prompt.split('Lote: ')[1]);
    assert.equal(batch.length, 2);
    assert.equal(batch[0].severity, 'high');
    assert.equal(result.status, 'incomplete');
    assert.equal(result.unverified.length, 1);
  });

  test(`${workflow}: sin hallazgos usa un solo pase, acotado al diff`, async () => {
    const { result, calls } = await execute(workflow, [{ findings: [], unreviewed: [] }]);
    assert.equal(result.status, 'complete');
    assert.equal(result.target, 'main...HEAD');
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].options.agentType, 'reviewer');
    assert.equal(calls[0].options.model, 'opus');
  });

  test(`${workflow}: deduplica antes de refutar el lote, sin fan-out por hallazgo`, async () => {
    const findings = Array.from({ length: 8 }, (_, i) => ({ ...finding, line: i + 1 }));
    const { result, calls, maxActive } = await execute(workflow, [
      { findings: [...findings, findings[0]], unreviewed: [] },
      {
        verdicts: findings.map((_, id) => ({
          id,
          status: 'confirmed',
          evidence: 'backend/example.cs:10',
        })),
      },
    ]);
    assert.equal(result.confirmed.length, 8);
    assert.equal(calls.length, 2);
    assert.equal(maxActive, 1);
    assert.equal(calls[1].options.agentType, 'review-verifier');
    assert.equal(calls[1].options.model, 'sonnet');
    assert.equal(calls[1].options.effort, 'medium');
    const batch = JSON.parse(calls[1].prompt.split('Lote: ')[1]);
    assert.equal(batch.length, 8);
  });

  test(`${workflow}: omisiones y áreas sin revisar nunca se convierten en limpio`, async () => {
    const { result } = await execute(workflow, [
      { findings: [finding, { ...finding, line: 11 }], unreviewed: ['another feature'] },
      { verdicts: [{ id: 0, status: 'refuted', evidence: 'guard.cs:12 handles it' }] },
    ]);
    assert.equal(result.status, 'incomplete');
    assert.equal(result.refuted.length, 1);
    assert.equal(result.unverified.length, 1);
    assert.deepEqual(result.unreviewed, ['another feature']);
  });

  test(`${workflow}: fallos, IDs duplicados y evidencia vacía conservan los pendientes`, async () => {
    for (const reply of [
      new Error('rate limit'),
      null,
      { verdicts: [] },
      { verdicts: [{ id: 0, status: 'refuted', evidence: '' }] },
      { verdicts: [{ id: 7, status: 'refuted', evidence: 'x:1' }] },
      {
        verdicts: [
          { id: 0, status: 'refuted', evidence: 'x:1' },
          { id: 0, status: 'confirmed', evidence: 'x:1' },
        ],
      },
    ]) {
      const { result, calls } = await execute(workflow, [
        { findings: [finding], unreviewed: [] },
        reply,
      ]);
      assert.equal(result.status, 'incomplete');
      assert.equal(result.unverified.length, 1);
      assert.equal(result.refuted.length, 0);
      assert.equal(calls.length, 2);
    }
  });

  test(`${workflow}: un pase inválido o incompleto no lanza verificadores ni aparenta éxito`, async () => {
    for (const reply of [
      new Error('offline'),
      null,
      {},
      { findings: [finding] },
      { findings: [], unreviewed: ['not done'] },
    ]) {
      const { result, calls } = await execute(workflow, [reply]);
      assert.equal(result.status, 'incomplete');
      assert.equal(calls.length, 1);
    }
  });

  test(`${workflow}: permite scope explícito y rechaza un alcance vacío o ambiguo`, async () => {
    const { result, calls } = await execute(workflow, [{ findings: [], unreviewed: [] }], {
      scope: 'backend/modules/identity',
    });
    assert.equal(result.scope, 'backend/modules/identity');
    assert.equal(result.target, undefined);
    assert.match(calls[0].prompt, /backend\/modules\/identity/);
    for (const args of [{ scope: '' }, { target: '' }, { scope: 'a', target: 'b' }]) {
      await assert.rejects(execute(workflow, [], args), /non-empty target or scope/);
    }
  });
}

test('quitar la delegación forzada conserva los guards de modelos y herramientas', () => {
  const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const commands: string[] = settings.hooks.PreToolUse.flatMap(
    (entry: { hooks: { command: string }[] }) => entry.hooks.map((hook) => hook.command),
  );
  assert.equal(commands.length, 2);
  assert.ok(commands.some((c) => c.includes('guard-agent-tier.mjs')));
  assert.ok(commands.some((c) => c.includes('guard-tool-budget.mjs')));
  assert.ok(!commands.some((c) => c.includes('guard-main-context')));
});

test('el guard admite los dos roles de review, pero no un override caro del verificador', () => {
  for (const [role, model, denied] of [
    ['reviewer', 'opus', false],
    ['review-verifier', 'sonnet', false],
    ['review-verifier', 'opus', true],
  ] as const) {
    const result = spawnSync(process.execPath, ['.claude/hooks/guard-agent-tier.mjs'], {
      encoding: 'utf8',
      input: JSON.stringify({ cwd: process.cwd(), tool_input: { subagent_type: role, model } }),
      env: { ...process.env, PLANB_GUARD_OFF: '0', CLAUDE_PROJECT_DIR: process.cwd() },
    });
    assert.equal(result.status, 0);
    const response = result.stdout.trim() ? JSON.parse(result.stdout) : {};
    assert.equal(response.hookSpecificOutput?.permissionDecision === 'deny', denied);
  }
});
