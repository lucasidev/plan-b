/**
 * Pre-push gate: si el branch toca paths de la zona E2E (mismo glob set que
 * `.github/labeler.yml`), exigimos que la suite Playwright pase localmente.
 *
 * Cierra el gap del lessons-learned 2026-05-08:
 *   "Pre-push hook lefthook queda como deuda solo si volvemos a olvidar
 *    correr E2E local."
 *
 * Algoritmo:
 *   1. Compara el branch contra `origin/main` y junta los files cambiados.
 *   2. Matcha contra los globs de zona E2E (mantenidos in sync con
 *      `.github/labeler.yml` por convención humana, ver doc abajo).
 *   3. Si no matchea: skip (exit 0). El push procede normal.
 *   4. Si matchea: chequea que backend (:5000/health) y frontend (:3000)
 *      estén corriendo. Si no: falla con mensaje guiado.
 *   5. Corre `bunx playwright test` (suite headless). Si pasa: exit 0.
 *      Si falla: exit 1 (push abortado, fixear specs antes de pushear).
 *
 * Escape hatches:
 *   - `SKIP_E2E_PRECHECK=1` en el env: skip total (para fixes de docs que
 *     casualmente tocan paths de zona E2E pero no afectan E2E real).
 *   - `git push --no-verify`: standard git escape hatch. Lefthook no
 *     intercepta. Usalo solo cuando sabés exactamente por qué.
 *
 * Sincronización con labeler.yml: la lista de globs de abajo refleja
 * `.github/labeler.yml`. Si agregás un path acá, agregalo allá también
 * (y viceversa). Convención humana, no enforcement automático. Si
 * alguien rompe la sincronía, el síntoma es:
 *   - Auto-label aplica `e2e` pero pre-push no obliga (laxo de más).
 *   - Pre-push obliga pero auto-label no aplica (estricto de más).
 *
 * Usage: bun scripts/check-e2e-zone.ts
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FRONTEND = resolve(ROOT, 'frontend');

// Globs de zona E2E. Mantener sincronizado con .github/labeler.yml.
// Cualquier file diff que matchee contra alguno → corremos E2E.
const E2E_ZONE_GLOBS = [
  // Frontend rutas / layouts / server actions / guards.
  'frontend/src/app/**',
  'frontend/middleware.ts',
  // Cross-cutting auth / session / api wiring.
  'frontend/src/lib/session.ts',
  'frontend/src/lib/forward-set-cookies.ts',
  'frontend/src/lib/api-client.ts',
  'frontend/src/lib/env.ts',
  // E2E suite directa.
  'frontend/e2e/**',
  // Playwright config.
  'frontend/playwright.config.ts',
  // Backend host (DI, pipeline, auth) + seed data + migrations.
  'backend/host/Planb.Api/**',
  // Migrations en cualquier módulo.
  'backend/modules/*/src/**/Migrations/**',
  // Identity entero (auth y session viven acá).
  'backend/modules/identity/**',
  // CI workflows que afectan E2E.
  '.github/workflows/e2e.yml',
  '.github/workflows/ci.yml',
];

if (process.env.SKIP_E2E_PRECHECK === '1') {
  console.log('[check-e2e-zone] SKIP_E2E_PRECHECK=1, saltando.');
  process.exit(0);
}

// 1) Files diff vs origin/main.
const diffResult = spawnSync('git', ['diff', '--name-only', 'origin/main...HEAD'], {
  cwd: ROOT,
  encoding: 'utf8',
});

if (diffResult.status !== 0) {
  console.error('[check-e2e-zone] git diff falló:');
  console.error(diffResult.stderr);
  // Si el diff no se puede calcular (ej. branch nueva sin upstream), skip
  // antes que romper push legítimos.
  console.warn(
    '[check-e2e-zone] No pudimos calcular el diff vs origin/main, saltando E2E precheck.',
  );
  process.exit(0);
}

const changedFiles = diffResult.stdout
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

if (changedFiles.length === 0) {
  console.log('[check-e2e-zone] No hay files cambiados vs origin/main, saltando.');
  process.exit(0);
}

// 2) Match contra zona E2E.
const matched = changedFiles.filter((f) => E2E_ZONE_GLOBS.some((g) => globMatch(g, f)));
if (matched.length === 0) {
  console.log('[check-e2e-zone] Ningún file cae en zona E2E. Skip.');
  process.exit(0);
}

console.log('[check-e2e-zone] Files en zona E2E:');
for (const f of matched) console.log(`  - ${f}`);

// 3) Chequear stack arriba.
const backendUp = isUp('http://localhost:5000/health');
const frontendUp = isUp('http://localhost:3000');

if (!backendUp || !frontendUp) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  ✗ E2E precheck: stack no está arriba.');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  if (!backendUp) console.error('    Backend (:5000) no responde.');
  if (!frontendUp) console.error('    Frontend (:3000) no responde.');
  console.error('');
  console.error('  Tu PR toca zona E2E (lista en `docs/testing/conventions.md`).');
  console.error('  Antes de pushear necesitamos correr la suite Playwright local.');
  console.error('');
  console.error('  Para arreglarlo:');
  console.error('    1. En otra terminal: just dev   (levanta backend + frontend)');
  console.error('    2. Esperá que ambos estén ready.');
  console.error('    3. Reintentá el push.');
  console.error('');
  console.error('  Si querés saltarlo (justificadamente, ej. doc-only que casualmente');
  console.error('  matchea pero no afecta E2E):');
  console.error('    SKIP_E2E_PRECHECK=1 git push');
  console.error('  o bien:');
  console.error('    git push --no-verify');
  console.error('');
  process.exit(1);
}

console.log('[check-e2e-zone] Stack arriba (backend + frontend). Corriendo Playwright...');
console.log('');

// 4) Correr Playwright via run-e2e-show (--headed + slowMo). El dev ve el
// browser abrirse y los flows correr. Single source of truth con el recipe
// `just frontend-test-e2e-show`. Si necesitás headless por algún motivo
// (raro local, casi siempre CI que usa otro path), exportá
// `SKIP_E2E_PRECHECK=1` y corré explícitamente.
const playwrightResult = spawnSync('bun', ['scripts/run-e2e-show.ts'], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (playwrightResult.status !== 0) {
  console.error('');
  console.error('[check-e2e-zone] ✗ Playwright falló. Fixear specs antes de pushear.');
  console.error('  Para re-correr aislado (mismo modo headed + slowMo):');
  console.error('    just frontend-test-e2e-show');
  process.exit(playwrightResult.status ?? 1);
}

console.log('');
console.log('[check-e2e-zone] ✓ Playwright verde. Push autorizado.');
process.exit(0);

// ─── helpers ────────────────────────────────────────────────────────────

/**
 * Match estilo gitignore / labeler. Soporta:
 *   - `*` matchea cualquier cosa salvo `/` (un segmento).
 *   - `**` matchea cualquier cosa incluyendo `/` (multi-segmento).
 *   - Resto se trata literal.
 *
 * Suficiente para los patterns de E2E_ZONE_GLOBS. Si en el futuro entran
 * patterns más exóticos (negaciones `!`, brace expansion `{a,b}`, etc.),
 * migrar a `picomatch` o equivalente.
 */
function globMatch(glob: string, path: string): boolean {
  const pattern = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__GLOBSTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__GLOBSTAR__/g, '.*');
  return new RegExp(`^${pattern}$`).test(path);
}

/**
 * Ping rápido a una URL HTTP. True si responde (cualquier status code,
 * incluido 4xx). False si conexión refused o timeout.
 */
function isUp(url: string): boolean {
  const result = spawnSync(
    'curl',
    ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '2', url],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return false;
  const code = result.stdout.trim();
  // "000" = curl falló (connection refused). Cualquier otro 3 dígitos = el
  // server respondió, así sea con error HTTP.
  return code.length === 3 && code !== '000';
}
