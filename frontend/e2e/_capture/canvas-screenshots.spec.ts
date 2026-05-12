/**
 * Captura screenshots de cada artboard del canvas de Claude Design.
 *
 * El canvas se splitea en HTMLs por área. En este PR aterrizan 3 canvases
 * (app del alumno + landing + design system); el canvas admin/backoffice
 * aterriza en un PR siguiente con su propio HTML + módulo:
 *   - `plan-b-design-system.html`  → 1 artboard (sistema visual)
 *   - `plan-b-landing.html`        → 1 artboard (landing pública)
 *   - `plan-b-app.html`            → app del alumno (auth, onb, inicio,
 *                                     mi-carrera, planificar, reseñas,
 *                                     rankings, búsqueda, notif, cuenta,
 *                                     soporte; modales y errores adentro
 *                                     de cada sección)
 *
 * No es un spec de E2E del producto: usa la infra de Playwright únicamente
 * para automatizar la captura visual del canvas. Por eso vive en
 * `e2e/_capture/` y `playwright.config.ts` excluye `_capture/**` del
 * `testIgnore` para que no se dispare con la suite E2E normal. Para correrlo:
 *
 *   PLAYWRIGHT_INCLUDE_CAPTURE=1 bunx playwright test e2e/_capture/canvas-screenshots.spec.ts
 *
 * Algoritmo:
 *   1. Levanta un static server con `node:http` sobre `docs/design/reference/`.
 *   2. Para cada `CANVAS` definido abajo: navega al HTML correspondiente,
 *      espera al menos un `.dc-card`, scrollea cada artboard y captura.
 *   3. Acumula resultados y genera `manifest.json` con todo junto.
 *   4. Cleanup del server.
 *
 * Si se agrega un artboard nuevo: agregarlo a la lista del canvas que
 * corresponde Y al HTML del canvas (`plan-b-<area>.html`).
 */

import { createReadStream, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const ROOT = resolve(process.cwd(), '..');
const DESIGN_DIR = resolve(ROOT, 'docs/design/reference');
const OUT_DIR = resolve(DESIGN_DIR, 'screenshots');
const PORT = 4567;
const BASE_URL = `http://localhost:${PORT}`;

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

type Canvas = {
  /** Filename del HTML del canvas dentro de `docs/design/reference/`. */
  file: string;
  /** Slug que se usa como prefijo en el nombre del PNG y en el manifest. */
  slug: 'ds' | 'landing' | 'app' | 'admin';
  artboards: ReadonlyArray<Artboard>;
};

const APP_W = 1200;
const APP_H = 750;

const CANVASES: ReadonlyArray<Canvas> = [
  {
    file: 'plan-b-design-system.html',
    slug: 'ds',
    artboards: [
      { section: 'ds', id: 'ds-main', label: 'Sistema visual', width: 1280, height: 900 },
    ],
  },
  {
    file: 'plan-b-landing.html',
    slug: 'landing',
    artboards: [
      { section: 'landing', id: 'lp', label: 'plan-b.com.ar', width: 1440, height: 2400 },
    ],
  },
  {
    file: 'plan-b-app.html',
    slug: 'app',
    artboards: [
      // ① Auth
      { section: 'auth', id: 'signup', label: 'Crear cuenta', width: APP_W, height: APP_H },
      {
        section: 'auth',
        id: 'signup-err',
        label: 'Crear cuenta · email duplicado',
        width: APP_W,
        height: APP_H,
      },
      { section: 'auth', id: 'login', label: 'Ingresar', width: APP_W, height: APP_H },
      {
        section: 'auth',
        id: 'login-err',
        label: 'Ingresar · credenciales inválidas',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'auth',
        id: 'forgot',
        label: 'Recuperar contraseña',
        width: APP_W,
        height: APP_H,
      },
      { section: 'auth', id: 'forgot-ok', label: 'Link enviado', width: APP_W, height: APP_H },
      // ② Onboarding
      { section: 'onb', id: 'welcome', label: '01 · Bienvenida', width: APP_W, height: APP_H },
      { section: 'onb', id: 'career', label: '02 · Carrera', width: APP_W, height: APP_H },
      { section: 'onb', id: 'history', label: '03 · Historial', width: APP_W, height: APP_H },
      { section: 'onb', id: 'done', label: '04 · Listo', width: APP_W, height: APP_H },
      // ③ Inicio (incluye errores globales)
      { section: 'home', id: 'v2-inicio', label: 'Inicio', width: APP_W, height: APP_H },
      {
        section: 'home',
        id: 'v2-inicio-empty',
        label: 'Inicio · vacío (alumno nuevo)',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'home',
        id: 'v2-inicio-offline',
        label: 'Inicio · sin conexión',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'home',
        id: 'v2-err-404',
        label: '404 · No encontrado',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'home',
        id: 'v2-err-5xx',
        label: '500 · Algo se rompió',
        width: APP_W,
        height: APP_H,
      },
      // ④ Mi carrera
      {
        section: 'plan',
        id: 'v2-carrera-p',
        label: 'Plan de estudios',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'plan',
        id: 'v2-carrera-g',
        label: 'Correlativas (grafo)',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'plan',
        id: 'v2-carrera-c',
        label: 'Catálogo de materias',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'plan',
        id: 'v2-mat-detail',
        label: 'Materia · detalle',
        width: APP_W,
        height: APP_H,
      },
      { section: 'plan', id: 'v2-carrera-d', label: 'Docentes', width: APP_W, height: APP_H },
      {
        section: 'plan',
        id: 'v2-doc-detail',
        label: 'Docente · detalle',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'plan',
        id: 'v2-carrera-h',
        label: 'Historial académico',
        width: APP_W,
        height: APP_H,
      },
      // ⑤ Planificar (incluye modales)
      { section: 'sim', id: 'v2-plan-curso', label: 'En curso', width: APP_W, height: APP_H },
      {
        section: 'sim',
        id: 'v2-plan-borr',
        label: 'Borrador 2027·1c',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'sim',
        id: 'v2-plan-empty',
        label: 'Planificar · sin borradores',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'sim',
        id: 'v2-modal-publicar',
        label: 'Modal · publicar plan del cuatri',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'sim',
        id: 'v2-modal-descartar',
        label: 'Modal · descartar borrador',
        width: APP_W,
        height: APP_H,
      },
      // ⑥ Reseñas (incluye modales)
      { section: 'resenas', id: 'v2-resenas-l', label: 'Explorar', width: APP_W, height: APP_H },
      { section: 'resenas', id: 'v2-resenas-e', label: 'Pendientes', width: APP_W, height: APP_H },
      {
        section: 'resenas',
        id: 'v2-resenas-e-empty',
        label: 'Pendientes · al día',
        width: APP_W,
        height: APP_H,
      },
      { section: 'resenas', id: 'v2-resenas-m', label: 'Mis reseñas', width: APP_W, height: APP_H },
      {
        section: 'resenas',
        id: 'v2-resenas-m-empty',
        label: 'Mis reseñas · primera vez',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'resenas',
        id: 'v2-resenas-edit',
        label: 'Editor de reseña',
        width: APP_W,
        height: 1100,
      },
      {
        section: 'resenas',
        id: 'v2-modal-borrar',
        label: 'Modal · borrar reseña',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'resenas',
        id: 'v2-modal-reportar',
        label: 'Modal · reportar reseña',
        width: APP_W,
        height: APP_H,
      },
      // ⑦ Rankings
      { section: 'rankings', id: 'v2-rankings', label: 'Rankings', width: APP_W, height: APP_H },
      // ⑧ Búsqueda
      {
        section: 'busqueda',
        id: 'v2-buscar',
        label: 'Búsqueda · dropdown abierto',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'busqueda',
        id: 'v2-buscar-empty',
        label: 'Búsqueda · sin resultados',
        width: APP_W,
        height: APP_H,
      },
      // ⑨ Notificaciones
      {
        section: 'notificaciones',
        id: 'v2-notif',
        label: 'Notificaciones · panel abierto',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'notificaciones',
        id: 'v2-notif-empty',
        label: 'Notificaciones · al día',
        width: APP_W,
        height: APP_H,
      },
      // ⑩ Cuenta (incluye modales)
      { section: 'cuenta', id: 'v2-perfil', label: 'Mi perfil', width: APP_W, height: APP_H },
      { section: 'cuenta', id: 'v2-ajustes', label: 'Ajustes', width: APP_W, height: APP_H },
      {
        section: 'cuenta',
        id: 'v2-modal-pass',
        label: 'Modal · cambiar contraseña',
        width: APP_W,
        height: APP_H,
      },
      {
        section: 'cuenta',
        id: 'v2-modal-logout',
        label: 'Modal · cerrar sesión',
        width: APP_W,
        height: APP_H,
      },
      // ⑪ Soporte
      { section: 'soporte', id: 'v2-ayuda', label: 'Ayuda', width: APP_W, height: APP_H },
      { section: 'soporte', id: 'v2-sobre', label: 'Sobre plan-b', width: APP_W, height: APP_H },
    ],
  },
];

let server: Server | null = null;

test.beforeAll(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  server = createServer((req, res) => {
    let pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (pathname === '/' || pathname === '') pathname = '/plan-b-app.html';
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

type CaptureResult = Artboard & {
  canvas: Canvas['slug'];
  file: string;
  ok: boolean;
  error?: string;
};

test('captura screenshots de cada artboard del canvas (multi-HTML)', async ({ page }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 1700, height: 1100 });

  const allResults: CaptureResult[] = [];

  for (const canvas of CANVASES) {
    const canvasUrl = `${BASE_URL}/${encodeURIComponent(canvas.file)}`;
    console.log(`\n[canvas] ${canvas.slug} (${canvas.file}): ${canvas.artboards.length} artboards`);

    await page.goto(canvasUrl, { waitUntil: 'networkidle' });
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

    for (const ab of canvas.artboards) {
      const selector = `[data-dc-section="${ab.section}"] [data-dc-slot="${ab.id}"] .dc-card`;
      // Naming: app / landing / ds usan `<section>-<id>.png` (compat con
      // embeddings históricos en US.md). admin usa prefix `admin-` para
      // distinguirse del app (ej. sección `onb` existe en ambos canvas).
      const filename =
        canvas.slug === 'admin' ? `admin-${ab.section}-${ab.id}.png` : `${ab.section}-${ab.id}.png`;
      const out = join(OUT_DIR, filename);

      try {
        const handle = await page.waitForSelector(selector, { timeout: 5_000, state: 'attached' });
        if (!handle) throw new Error('handle null');
        await handle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        await handle.screenshot({ path: out });
        console.log(`  ✓ ${filename}`);
        allResults.push({ ...ab, canvas: canvas.slug, file: filename, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  ✗ ${filename}  (${message})`);
        allResults.push({ ...ab, canvas: canvas.slug, file: filename, ok: false, error: message });
      }
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: CANVASES.map((c) => `docs/design/reference/${c.file}`),
    artboards: allResults.map(({ canvas, section, id, label, width, height, file, ok, error }) => ({
      canvas,
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

  const failed = allResults.filter((r) => !r.ok);
  console.log(
    `\n[capture] ${allResults.length - failed.length}/${allResults.length} ok, ${failed.length} fallidos.`,
  );

  expect(
    failed,
    `Algunos artboards no se pudieron capturar:\n${failed.map((f) => `  - ${f.file}: ${f.error}`).join('\n')}`,
  ).toEqual([]);
});
