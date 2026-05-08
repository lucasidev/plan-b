/**
 * Captura screenshots de cada artboard del canvas de Claude Design
 * (`docs/design/reference/plan-b-direcciones.html`).
 *
 * No es un spec de E2E del producto: usa la infra de Playwright únicamente
 * para automatizar la captura visual del canvas. Por eso vive en
 * `e2e/_capture/` y `playwright.config.ts` excluye `_capture/**` del
 * `testIgnore` para que no se dispare con la suite E2E normal. Para correrlo:
 *
 *   bunx playwright test e2e/_capture/canvas-screenshots.spec.ts
 *
 * Algoritmo:
 *   1. Levanta un static server con Bun.serve sobre `docs/design/reference/`.
 *   2. Navega a `http://localhost:4567/plan-b-direcciones.html`.
 *   3. Espera al menos un `.dc-card` mountado.
 *   4. Para cada artboard de la lista: scroll into view + element screenshot.
 *   5. Genera `manifest.json` con la info de cada captura.
 *   6. Cleanup del server.
 *
 * Si se agrega un artboard nuevo al canvas, agregarlo a `ARTBOARDS` también.
 */

import { createReadStream, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// El test runner ejecuta este archivo desde `frontend/`, así que `..` salta
// al root del repo. Usamos `process.cwd()` en vez de `import.meta.dirname`
// para evitar incompatibilidades con el CJS loader de playwright.
const ROOT = resolve(process.cwd(), '..');
const DESIGN_DIR = resolve(ROOT, 'docs/design/reference');
const OUT_DIR = resolve(DESIGN_DIR, 'screenshots');
const PORT = 4567;
const CANVAS_URL = `http://localhost:${PORT}/plan-b-direcciones.html`;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
};

type Artboard = {
  section: string;
  id: string;
  label: string;
  width: number;
  height: number;
};

const ARTBOARDS: ReadonlyArray<Artboard> = [
  // ⓪ Design System
  { section: 'ds', id: 'ds-main', label: 'Sistema visual', width: 1280, height: 900 },
  // ① Landing
  { section: 'landing', id: 'lp', label: 'plan-b.com.ar', width: 1440, height: 2400 },
  // ② Auth
  { section: 'auth', id: 'signup', label: 'Crear cuenta', width: 1200, height: 750 },
  { section: 'auth', id: 'login', label: 'Ingresar', width: 1200, height: 750 },
  { section: 'auth', id: 'forgot', label: 'Recuperar contraseña', width: 1200, height: 750 },
  { section: 'auth', id: 'forgot-ok', label: 'Link enviado', width: 1200, height: 750 },
  // ③ Onboarding
  { section: 'onb', id: 'welcome', label: '01 · Bienvenida', width: 1200, height: 750 },
  { section: 'onb', id: 'career', label: '02 · Carrera', width: 1200, height: 750 },
  { section: 'onb', id: 'history', label: '03 · Historial', width: 1200, height: 750 },
  { section: 'onb', id: 'done', label: '04 · Listo', width: 1200, height: 750 },
  // ④ Inicio
  { section: 'home', id: 'v2-inicio', label: 'Inicio', width: 1200, height: 750 },
  // ⑤ Mi carrera
  { section: 'plan', id: 'v2-carrera-p', label: 'Plan de estudios', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-carrera-g', label: 'Correlativas (grafo)', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-carrera-c', label: 'Catálogo de materias', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-mat-detail', label: 'Materia · detalle', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-carrera-d', label: 'Docentes', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-doc-detail', label: 'Docente · detalle', width: 1200, height: 750 },
  { section: 'plan', id: 'v2-carrera-h', label: 'Historial académico', width: 1200, height: 750 },
  // ⑥ Planificar
  { section: 'sim', id: 'v2-plan-curso', label: 'En curso', width: 1200, height: 750 },
  { section: 'sim', id: 'v2-plan-borr', label: 'Borrador 2027·1c', width: 1200, height: 750 },
  // ⑦ Reseñas
  { section: 'resenas', id: 'v2-resenas-l', label: 'Explorar', width: 1200, height: 750 },
  { section: 'resenas', id: 'v2-resenas-e', label: 'Pendientes', width: 1200, height: 750 },
  { section: 'resenas', id: 'v2-resenas-m', label: 'Mis reseñas', width: 1200, height: 750 },
  {
    section: 'resenas',
    id: 'v2-resenas-edit',
    label: 'Editor de reseña',
    width: 1200,
    height: 1100,
  },
  // ⑧ Rankings
  { section: 'rankings', id: 'v2-rankings', label: 'Rankings', width: 1200, height: 750 },
  // ⑨ Búsqueda
  {
    section: 'busqueda',
    id: 'v2-buscar',
    label: 'Búsqueda · dropdown abierto',
    width: 1200,
    height: 750,
  },
  // ⑩ Cuenta
  { section: 'cuenta', id: 'v2-perfil', label: 'Mi perfil', width: 1200, height: 750 },
  { section: 'cuenta', id: 'v2-ajustes', label: 'Ajustes', width: 1200, height: 750 },
  // ⑪ Soporte
  { section: 'soporte', id: 'v2-ayuda', label: 'Ayuda', width: 1200, height: 750 },
  { section: 'soporte', id: 'v2-sobre', label: 'Sobre plan-b', width: 1200, height: 750 },
];

let server: Server | null = null;

test.beforeAll(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  server = createServer((req, res) => {
    let pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (pathname === '/' || pathname === '') pathname = '/plan-b-direcciones.html';
    const filePath = join(DESIGN_DIR, pathname);
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        res.writeHead(404).end('Not found');
        return;
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise<void>((r) => server?.listen(PORT, '127.0.0.1', r));
});

test.afterAll(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
});

test('captura screenshots de cada artboard del canvas', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1600, height: 1000 });

  await page.goto(CANVAS_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.dc-card', { timeout: 30_000 });
  await page.waitForTimeout(2_000);

  // Reset cualquier transform/zoom Figma-like del canvas.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[data-dc-section], [data-dc-slot]').forEach((el) => {
      el.style.transform = 'none';
    });
    const root = document.getElementById('root');
    if (root) root.style.transform = 'none';
  });

  const results: Array<Artboard & { file: string; ok: boolean; error?: string }> = [];

  for (const ab of ARTBOARDS) {
    const selector = `[data-dc-section="${ab.section}"] [data-dc-slot="${ab.id}"] .dc-card`;
    const filename = `${ab.section}-${ab.id}.png`;
    const out = join(OUT_DIR, filename);

    try {
      const handle = await page.waitForSelector(selector, { timeout: 5_000, state: 'attached' });
      if (!handle) throw new Error('handle null');
      await handle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await handle.screenshot({ path: out });
      console.log(`  ✓ ${filename}`);
      results.push({ ...ab, file: filename, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ ${filename}  (${message})`);
      results.push({ ...ab, file: filename, ok: false, error: message });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'docs/design/reference/plan-b-direcciones.html',
    artboards: results.map(({ section, id, label, width, height, file, ok, error }) => ({
      section,
      id,
      label,
      width,
      height,
      file,
      ok,
      error,
    })),
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n[capture] ${results.length - failed.length}/${results.length} ok, ${failed.length} fallidos.`,
  );

  expect(
    failed,
    `Algunos artboards no se pudieron capturar:\n${failed.map((f) => `  - ${f.file}: ${f.error}`).join('\n')}`,
  ).toEqual([]);
});
