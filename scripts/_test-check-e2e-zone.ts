/**
 * Throwaway tests for scripts/check-e2e-zone.ts.
 * Sigue el mismo patrón que `_test-append-changelog.ts`.
 * Migrar a vitest cuando aterrice US-T01.
 *
 * Run: bun scripts/_test-check-e2e-zone.ts
 *
 * Cubre el bug del 2026-05-15: `spawnSync('curl', ...)` no resolvía el
 * binario en Windows con Bun → `isUp` siempre devolvía false → pre-push
 * bloqueaba cualquier branch con cambios en zona E2E. El fix migra a
 * `fetch` nativo, y este test cierra el gap pidiéndole a un server local
 * que responda en una URL real.
 */
import { globMatch, isUp } from './check-e2e-zone';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    pass++;
  } else {
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
    fail++;
  }
}

function group(name: string, fn: () => Promise<void> | void) {
  console.log(`\n${name}`);
  return fn();
}

// ────────────────────────────────────────────────────────────────────────────

await group('globMatch (regression: el bug no debe propagarse a otros helpers)', () => {
  check('matchea single-segment', globMatch('frontend/src/app/**', 'frontend/src/app/page.tsx'));
  check(
    'matchea multi-segment con globstar',
    globMatch('frontend/src/app/**', 'frontend/src/app/(authed)/mi-carrera/page.tsx'),
  );
  check(
    'no matchea fuera de la zona',
    !globMatch('frontend/src/app/**', 'frontend/src/lib/utils.ts'),
  );
  check(
    'matchea migrations en cualquier módulo',
    globMatch(
      'backend/modules/*/src/**/Migrations/**',
      'backend/modules/identity/src/Infrastructure/Migrations/20260515_init.cs',
    ),
  );
});

await group('isUp', async () => {
  // 1) Server responde 200 → true.
  const okServer = Bun.serve({ port: 0, fetch: () => new Response('ok') });
  const okUrl = `http://localhost:${okServer.port}/`;
  check(`200 response → true (${okUrl})`, (await isUp(okUrl)) === true);

  // 2) Server responde 500 → true (cualquier status cuenta como "arriba").
  const errServer = Bun.serve({
    port: 0,
    fetch: () => new Response('boom', { status: 500 }),
  });
  const errUrl = `http://localhost:${errServer.port}/`;
  check(`5xx response → true (${errUrl})`, (await isUp(errUrl)) === true);

  // 3) Puerto cerrado (connection refused) → false.
  // Puerto 1 es privilegiado y nunca hay nada escuchando ahí en un dev box;
  // si por algún motivo está bindeado, este test falla en CI y lo detectamos.
  check('connection refused → false', (await isUp('http://localhost:1/')) === false);

  // 4) Server que no responde a tiempo → false (timeout).
  const slowServer = Bun.serve({
    port: 0,
    fetch: async () => {
      await new Promise((r) => setTimeout(r, 5000));
      return new Response('slow');
    },
  });
  const slowUrl = `http://localhost:${slowServer.port}/`;
  check(`timeout → false (${slowUrl})`, (await isUp(slowUrl, 100)) === false);

  okServer.stop(true);
  errServer.stop(true);
  slowServer.stop(true);
});

// ────────────────────────────────────────────────────────────────────────────

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
