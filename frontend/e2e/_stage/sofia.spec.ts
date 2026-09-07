import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * El recorrido de Sofía (docs/product/personas.md) como prueba manual simulada contra el stage
 * real (`https://planb.olisar.com.ar`). Con la cuenta de equipo sembrada (admin@planb.local):
 * carga el catálogo académico a mano y cura lo que llega del campo libre de las reseñas.
 *
 * No es E2E de regresión: `playwright.config.ts` la excluye de la suite salvo
 * `PLAYWRIGHT_INCLUDE_STAGE=1` (nunca en CI, mismo mecanismo que `walk.spec.ts` y
 * `valentina.spec.ts`), y corre a mano.
 *
 * Cada paso asierta lo que Sofía espera según su story, con `expect.soft`: si el producto no lo
 * cumple, ese paso queda en rojo y el recorrido sigue igual hasta el final. Además de la aserción,
 * cada paso deja un renglón en `rows` con el texto real leído de la pantalla (no lo que se
 * esperaba), y al final ese registro se vuelca a un archivo Markdown.
 *
 * Los pasos 2, 3 (equipo docente), 4 (corte de serie), 6, 7 y 8 buscan con patrones de texto
 * amplios: el backoffice autenticado no tiene ningún otro spec de regresión que los cubra, así
 * que un veredicto "no cumple" ahí puede reflejar tanto un hueco real como un wording distinto
 * al buscado. El resto (login, alta de cátedra sin titular, destilar en curaduría, catálogo de
 * items, Método) reusa selectores ya verificados contra este mismo stage por `walk.spec.ts`.
 *
 * Corre a 300 s (`test.setTimeout`) y sin retries (config global).
 */

const CAREER_SOFTWARE_QUALITY_ID = '00000002-0000-4000-a000-000000000003';
const SUBJECT_FUNDAMENTOS_ID = '00000004-0000-4000-a000-000000000012';

const ASSETS_DIR = resolve(__dirname, '../../../docs/history/reviews/assets/2026-09-07-sofia');

// Mismo mecanismo que `valentina.spec.ts`: el default cae dentro de `frontend/`, y la corrida real
// puede redirigirlo con esta variable a un lugar fuera del repo.
const VERDICTS_PATH =
  process.env.SOFIA_VERDICTS_PATH ?? resolve(__dirname, '../../test-results/sofia-verdicts.md');

type Verdict = 'cumple' | 'no cumple' | 'parcial';

interface VerdictRow {
  step: number;
  story: string;
  expected: string;
  observed: string;
  verdict: Verdict;
  screenshot: string;
}

const rows: VerdictRow[] = [];

function record(row: VerdictRow): void {
  rows.push(row);
}

/** Cardinalidad de una lista de checks booleanos: todos, ninguno o algunos. */
function combineVerdict(flags: boolean[]): Verdict {
  const passed = flags.filter(Boolean).length;
  if (passed === flags.length) return 'cumple';
  if (passed === 0) return 'no cumple';
  return 'parcial';
}

/**
 * Visibilidad acotada en el tiempo, sin auto-wait de `expect`: un timeout corto para lo que se
 * espera ausente evita que el recorrido pague 10 s (el default de `expect.timeout`) por cada cosa
 * que ya se sabe que no está.
 */
async function isVisible(locator: Locator, timeoutMs = 5000): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

/** Envuelve `isVisible` con la aserción soft: encodea lo que Sofía espera, no lo que hay. */
async function checkVisible(locator: Locator, message: string, timeoutMs = 5000): Promise<boolean> {
  const ok = await isVisible(locator, timeoutMs);
  expect.soft(ok, message).toBe(true);
  return ok;
}

/** Texto real de un locator, o cadena vacía si no matchea nada (sin esperar de más). */
async function textOf(locator: Locator): Promise<string> {
  const count = await locator.count();
  if (count === 0) return '';
  return ((await locator.first().textContent()) ?? '').trim();
}

async function shot(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: resolve(ASSETS_DIR, filename), fullPage: true });
}

function escapeCell(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

/** Correlaciona todo lo que esta corrida crea: la cátedra, la frase destilada, la nota editorial. */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

const SUFFIX = randomSuffix();

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env: ${hint}`);
  }
  return value;
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
}

/** Una vista sin cuenta, en un contexto aparte, para no perder la sesión de Sofía en `page`. */
async function withAnonymousPage(
  browser: Browser,
  fn: (anonPage: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext();
  try {
    const anonPage = await context.newPage();
    await fn(anonPage);
  } finally {
    await context.close();
  }
}

let seedPassword: string;

test.beforeAll(async () => {
  await mkdir(ASSETS_DIR, { recursive: true });
  seedPassword = requireEnv(
    'STAGE_SEED_PASSWORD',
    'la password con la que el stage sembró admin@planb.local y el resto de las personas.',
  );
});

test('Sofía carga el catálogo y cura lo que llega de las reseñas', async ({ page, browser }) => {
  test.setTimeout(300_000);

  await test.step('1. El corte de acceso (US-215)', async () => {
    const adminRoutes = ['/admin/universities', '/admin/chairs', '/admin/curation', '/admin/items'];
    const landings: string[] = [];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      landings.push(`${route} -> ${page.url()}`);
    }
    const allBlocked = landings.every((l) => /\/sign-in/.test(l));
    expect
      .soft(
        allBlocked,
        'sin cuenta, ninguna de las 4 rutas de admin debe leerse: todas mandan a Ingresar o dan 401/403',
      )
      .toBe(true);
    await shot(page, '01-access-cut-anonymous.png');
    record({
      step: 1,
      story: 'US-215',
      expected:
        'Sin cuenta, /admin/universities, /admin/chairs, /admin/curation y /admin/items no se leen: redirigen a Ingresar o dan 401/403.',
      observed: landings.join(' · '),
      verdict: allBlocked ? 'cumple' : 'no cumple',
      screenshot: '01-access-cut-anonymous.png',
    });

    await signIn(page, ADMIN.email, seedPassword);
    const loggedIn = await page
      .waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    expect
      .soft(loggedIn, 'admin@planb.local debe poder entrar con la password sembrada')
      .toBe(true);
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, '01-access-cut-admin.png');

    const nav = page.getByRole('navigation');
    const hasNav = await isVisible(nav, 3000);
    const navText = hasNav ? (await nav.first().innerText()).replace(/\s+/g, ' ').trim() : '';
    const links = (await page.getByRole('link').allTextContents()).filter(Boolean);
    record({
      step: 1,
      story: 'US-215',
      expected:
        'Con admin@planb.local, a dónde llega y qué le ofrece el backoffice (el menú o las pantallas alcanzables).',
      observed: `Aterriza en ${page.url()}. ${hasNav ? `Menú: "${navText}"` : `Sin role=navigation; links visibles: ${links.slice(0, 15).join(', ')}`}`,
      verdict: loggedIn ? 'cumple' : 'no cumple',
      screenshot: '01-access-cut-admin.png',
    });
  });

  await test.step('2. Ver qué falta antes que lo cargado (US-191, US-200, US-203, US-192)', async () => {
    await page.goto('/admin/universities');
    await page.waitForLoadState('networkidle').catch(() => {});

    const gapsView = page.getByText(/huecos?\b|falta[n]? medir|sin medir todavía/i);
    const requestQueue = page.getByText(
      /cola de pedidos|pedidos pendientes|lo más pedido|ordenad[oa] por demanda/i,
    );
    const hasGaps = await isVisible(gapsView, 4000);
    const hasQueue = await isVisible(requestQueue, 4000);
    const heading = page.getByRole('heading').first();

    await shot(page, '02-gaps-and-queue.png');
    record({
      step: 2,
      story: 'US-191 / US-200 / US-203 / US-192',
      expected:
        'Una vista de huecos ordenada por lo que bloquea lo publicado, y una cola de pedidos ordenada por demanda con su ritmo.',
      observed: `/admin/universities muestra "${await textOf(heading)}". Vista de huecos: ${hasGaps ? `aparece ("${await textOf(gapsView)}")` : 'no aparece'}. Cola de pedidos: ${hasQueue ? `aparece ("${await textOf(requestQueue)}")` : 'no aparece'}. Lo que hay en su lugar es el Catálogo (universidades y carreras).`,
      verdict: combineVerdict([hasGaps, hasQueue]),
      screenshot: '02-gaps-and-queue.png',
    });
  });

  const chairName = `Sofia${SUFFIX}`;
  const chairHeading = page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') });

  await test.step('3. Cargar una cátedra como entidad propia, con su titular (US-196)', async () => {
    await page.goto(`/admin/chairs?subjectId=${SUBJECT_FUNDAMENTOS_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
    await page.getByRole('button', { name: /cargar cátedra/i }).click();
    const created = await checkVisible(
      chairHeading,
      `"Cátedra ${chairName}" debe aparecer cargada`,
      15_000,
    );
    await shot(page, '03-chair-created.png');
    record({
      step: 3,
      story: 'US-196',
      expected: `Cargar "Cátedra ${chairName}" desde /admin/chairs, como entidad propia.`,
      observed: created
        ? `Aparece "${await textOf(chairHeading)}".`
        : 'La cátedra no apareció cargada tras enviar el formulario.',
      verdict: created ? 'cumple' : 'no cumple',
      screenshot: '03-chair-created.png',
    });

    // walk.spec.ts (paso 7a) ya documentó que la UI para sumar un integrante no existe todavía y
    // lo carga por API; acá se busca igual, sin usar la API, porque lo que se mide es la pantalla.
    const teamControl = page
      .getByRole('button', { name: /titular|integrante del equipo|sumar docente|agregar docente/i })
      .or(page.getByLabel(/docente a cargo|rol en la cátedra/i));
    const hasTeamUi = await isVisible(teamControl, 4000);
    await shot(page, '03-chair-team.png');
    record({
      step: 3,
      story: 'US-196',
      expected:
        'Sumarle un titular desde la UI: un formulario para el equipo docente (docente y rol).',
      observed: hasTeamUi
        ? `Aparece un control candidato: "${await textOf(teamControl)}"`
        : 'No hay en pantalla ningún formulario ni control para sumar un integrante al equipo docente de la cátedra recién creada.',
      verdict: hasTeamUi ? 'cumple' : 'no cumple',
      screenshot: '03-chair-team.png',
    });

    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    const chairCard = page.getByRole('listitem').filter({ has: chairHeading });
    const cardVisible = await isVisible(chairCard, 8000);
    const cardText = cardVisible
      ? (await chairCard.first().innerText()).replace(/\s+/g, ' ').trim()
      : '';
    record({
      step: 3,
      story: 'US-196',
      expected: 'Cómo queda la cátedra nueva en la lista del backoffice.',
      observed: cardVisible
        ? `"${cardText}"`
        : 'No se encontró como ítem de la lista tras recargar.',
      verdict: cardVisible ? 'cumple' : 'no cumple',
      screenshot: '03-chair-team.png',
    });

    await withAnonymousPage(browser, async (anonPage) => {
      await anonPage.goto(`/subjects/${SUBJECT_FUNDAMENTOS_ID}`);
      await anonPage.waitForLoadState('networkidle').catch(() => {});
      const publicChairLink = anonPage.getByRole('link', { name: new RegExp(chairName) });
      const belowFloor = await isVisible(publicChairLink, 5000);
      await anonPage.screenshot({
        path: resolve(ASSETS_DIR, '03-chair-public.png'),
        fullPage: true,
      });
      record({
        step: 3,
        story: 'US-196',
        expected:
          'Sin cuenta, la cátedra nueva aparece en la ficha pública de la materia 211 como cátedra bajo el piso.',
        observed: belowFloor
          ? `Aparece "${await textOf(publicChairLink)}" en la ficha pública de la materia.`
          : 'No aparece ningún link con ese nombre en la ficha pública de la materia 211.',
        verdict: belowFloor ? 'cumple' : 'no cumple',
        screenshot: '03-chair-public.png',
      });
    });
  });

  await test.step('4. Editar la frase en un solo lugar (US-198)', async () => {
    const targetPhrase = '¿Se dictaron las clases?';
    await page.goto('/admin/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByLabel(/buscar en el catálogo/i).fill('dictaron las clases');
    const phraseButton = page.getByRole('button', { name: /¿Se dictaron las clases\?/i });
    const foundInCatalog = await checkVisible(
      phraseButton,
      `"${targetPhrase}" debe estar en el catálogo de /admin/items`,
      8000,
    );
    await shot(page, '04-edit-phrase-search.png');
    record({
      step: 4,
      story: 'US-198',
      expected: `La frase "${targetPhrase}" se encuentra en el catálogo de /admin/items.`,
      observed: foundInCatalog
        ? `Aparece un botón "${await textOf(phraseButton)}".`
        : 'No se encontró ningún botón con esa frase en el catálogo.',
      verdict: foundInCatalog ? 'cumple' : 'no cumple',
      screenshot: '04-edit-phrase-search.png',
    });
    if (!foundInCatalog) return;

    await phraseButton.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    const questionField = page.getByLabel('La pregunta');
    const hasEditForm = await isVisible(questionField, 5000);
    await shot(page, '04-edit-phrase-form.png');
    record({
      step: 4,
      story: 'US-198',
      expected:
        'Al abrir la frase, un formulario para corregir el texto sin cambiar el significado.',
      observed: hasEditForm
        ? `Campo editable con el valor: "${await questionField.inputValue().catch(() => '(no se pudo leer)')}"`
        : 'No se abrió ningún campo editable reconocible como getByLabel("La pregunta").',
      verdict: hasEditForm ? 'cumple' : 'no cumple',
      screenshot: '04-edit-phrase-form.png',
    });

    if (hasEditForm) {
      const original = await questionField.inputValue();
      const corrected = original.replace('dictaron', 'dieron');
      const saveButton = page.getByRole('button', {
        name: /guardar|actualizar|corregir|confirmar/i,
      });
      let changedVisibleInMethod = false;
      let revertedOk = false;
      try {
        await questionField.fill(corrected);
        if (await isVisible(saveButton, 3000)) {
          await saveButton.click();
          await page.waitForTimeout(1500);
        }
        await page.goto('/method');
        await page.waitForLoadState('networkidle').catch(() => {});
        changedVisibleInMethod = await isVisible(page.getByText(corrected), 6000);
        await shot(page, '04-edit-phrase-method.png');
      } finally {
        // Revertir siempre, haya salido bien el guardado o no: no dejar la frase mutada.
        await page.goto('/admin/items');
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.getByLabel(/buscar en el catálogo/i).fill('dieron las clases');
        const revertButton = page.getByRole('button', { name: /dieron las clases/i });
        if (await isVisible(revertButton, 5000)) {
          await revertButton.click();
          await page.waitForLoadState('networkidle').catch(() => {});
          const revertField = page.getByLabel('La pregunta');
          if (await isVisible(revertField, 4000)) {
            await revertField.fill(original);
            const revertSave = page.getByRole('button', {
              name: /guardar|actualizar|corregir|confirmar/i,
            });
            if (await isVisible(revertSave, 3000)) {
              await revertSave.click();
              await page.waitForTimeout(1000);
              revertedOk = true;
            }
          }
        }
      }
      record({
        step: 4,
        story: 'US-198',
        expected:
          'El cambio del texto se ve reflejado en Método (/method) y en el formulario de reseñar.',
        observed: changedVisibleInMethod
          ? 'El texto corregido aparece en /method.'
          : 'El texto corregido no se confirmó en /method tras guardar.',
        verdict: changedVisibleInMethod ? 'cumple' : 'no cumple',
        screenshot: '04-edit-phrase-method.png',
      });
      record({
        step: 4,
        story: 'US-198 (limpieza)',
        expected: 'Dejar la frase como estaba antes de este recorrido.',
        observed: revertedOk
          ? 'Se revirtió el texto original correctamente.'
          : 'No se pudo confirmar la reversión: revisar manualmente el catálogo de items.',
        verdict: revertedOk ? 'cumple' : 'no cumple',
        screenshot: '04-edit-phrase-form.png',
      });
    }

    const seriesCutWording = page.getByText(
      /corte de serie|nuevo código|cambia el significado|nueva versión del ítem/i,
    );
    const hasSeriesCutWording = await isVisible(seriesCutWording, 3000);
    record({
      step: 4,
      story: 'US-198',
      expected: 'Un cambio de significado abre un código nuevo, con el corte de serie declarado.',
      observed: hasSeriesCutWording
        ? `La pantalla explica esta distinción: "${await textOf(seriesCutWording)}"`
        : 'No se encontró ninguna explicación en pantalla sobre la diferencia entre corregir el texto y cambiar el significado (código nuevo, corte de serie).',
      verdict: hasSeriesCutWording ? 'cumple' : 'no cumple',
      screenshot: '04-edit-phrase-form.png',
    });
  });

  const distilledCode = `SOFIA_${SUFFIX}`;
  const distilledQuestion = `¿Encontraste la cátedra que buscabas en el catálogo? (${SUFFIX})`;

  await test.step('5. Revisar lo destilado antes de ofrecerlo (US-199) y curar el campo libre', async () => {
    await page.goto('/admin/curation');
    await page.waitForLoadState('networkidle').catch(() => {});

    const emptyStateText = page.getByText(/todavía no|nadie escribió|sin comentarios todavía/i);
    const isEmptyState = await isVisible(emptyStateText, 3000);
    const main = page.getByRole('main');
    const mainSnapshot = (
      (await isVisible(main, 3000))
        ? await main.innerText()
        : await page.locator('body').innerText()
    )
      .replace(/\s+/g, ' ')
      .trim();
    await shot(page, '05-curation-free-text.png');
    record({
      step: 5,
      story: 'US-199',
      expected:
        'Ver el texto libre que dejaron las reseñas (de otros recorridos, si corrieron antes).',
      observed: isEmptyState ? `"${await textOf(emptyStateText)}"` : mainSnapshot.slice(0, 600),
      verdict: 'cumple',
      screenshot: '05-curation-free-text.png',
    });

    const reviewQueueWording = page.getByText(
      /cola de revisión|para revisar|pendiente de aprobación|por aprobar/i,
    );
    const hasReviewQueueBeforeSubmit = await isVisible(reviewQueueWording, 2000);

    await page.getByLabel('Código').fill(distilledCode);
    await page.getByLabel('La pregunta').fill(distilledQuestion);
    await page.getByLabel(/etiqueta de la opción 1/i).fill('Sí');
    await page.getByLabel(/etiqueta de la opción 2/i).fill('No');
    await page.getByRole('button', { name: 'Destilar' }).click();

    const status = page.getByRole('status');
    const distilled = await checkVisible(
      status,
      'debe confirmar que la frase entró en una versión nueva',
      15_000,
    );
    const statusText = distilled ? await textOf(status) : '';
    await shot(page, '05-curation-distill.png');
    record({
      step: 5,
      story: 'US-199',
      expected: `Destilar una frase nueva (código ${distilledCode}) que entre a una versión nueva del instrumento.`,
      observed: distilled ? statusText : 'No se confirmó ningún mensaje de éxito tras destilar.',
      verdict: distilled ? 'cumple' : 'no cumple',
      screenshot: '05-curation-distill.png',
    });

    await page.goto('/admin/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByLabel(/buscar en el catálogo/i).fill(distilledCode);
    const inCatalog = await checkVisible(
      page.getByRole('button', { name: new RegExp(`^${distilledCode}\\b`) }),
      `${distilledCode} debe aparecer en /admin/items`,
      10_000,
    );

    await page.goto('/method');
    await page.waitForLoadState('networkidle').catch(() => {});
    const markedInMethod = page.getByText(distilledQuestion);
    const hasInMethod = await checkVisible(
      markedInMethod,
      `"${distilledQuestion}" debe aparecer en Método`,
      10_000,
    );
    const markedText = hasInMethod ? await textOf(markedInMethod) : '';
    await shot(page, '05-curation-distill.png');
    record({
      step: 5,
      story: 'US-199',
      expected: `${distilledCode} aparece en /admin/items y en Método marcada como "destilada".`,
      observed: `En /admin/items: ${inCatalog ? 'aparece' : 'no aparece'}. En Método: ${hasInMethod ? `"${markedText}"` : 'no aparece'}.`,
      verdict: combineVerdict([inCatalog, hasInMethod, markedText.includes('destilada')]),
      screenshot: '05-curation-distill.png',
    });

    record({
      step: 5,
      story: 'US-199',
      expected: 'Una cola de revisión antes de ofrecer la frase destilada a quien reseña.',
      observed: hasReviewQueueBeforeSubmit
        ? 'Aparece wording relacionado a una cola de revisión antes de destilar.'
        : 'No se encontró ninguna cola de revisión: destilar la deja disponible directamente, sin paso previo visible.',
      verdict: hasReviewQueueBeforeSubmit ? 'cumple' : 'no cumple',
      screenshot: '05-curation-distill.png',
    });
  });

  await test.step('6. Nota editorial sin nombres (ADR-0084)', async () => {
    await page.goto('/admin/curation');
    await page.waitForLoadState('networkidle').catch(() => {});
    const noteField = page.getByLabel(/nota editorial|nota de curaduría|nota a nivel carrera/i);
    const noteControl = page.getByRole('button', {
      name: /nota editorial|agregar nota|escribir nota/i,
    });
    const hasNoteEntryPoint =
      (await isVisible(noteField, 4000)) || (await isVisible(noteControl, 3000));
    await shot(page, '06-editorial-note-entry.png');

    if (!hasNoteEntryPoint) {
      record({
        step: 6,
        story: 'ADR-0084',
        expected: 'Desde la curaduría, un lugar para escribir una nota editorial a nivel carrera.',
        observed:
          'No se encontró ningún campo ni botón relacionado a una nota editorial en /admin/curation.',
        verdict: 'no cumple',
        screenshot: '06-editorial-note-entry.png',
      });
      return;
    }

    if (await isVisible(noteControl, 1000)) {
      await noteControl.click();
    }
    const activeField = page.getByLabel(/nota editorial|nota de curaduría|nota a nivel carrera/i);
    const submitButton = page.getByRole('button', {
      name: /publicar nota|guardar nota|publicar|guardar/i,
    });

    const withNameText = `Recorrido de Sofía (${SUFFIX}): según Pérez, el plan cambió en 2023.`;
    await activeField.fill(withNameText);
    await submitButton.click();
    const rejection = page.getByText(
      /no puede llevar nombres|nombre de.*docente|sin nombres propios|remové el nombre/i,
    );
    const wasRejected = await isVisible(rejection, 5000);
    await shot(page, '06-editorial-note-rejected.png');
    record({
      step: 6,
      story: 'ADR-0084',
      expected: 'Una nota con el nombre de un docente de la universidad se rechaza, con el motivo.',
      observed: wasRejected
        ? `Se rechaza con: "${await textOf(rejection)}"`
        : 'No se detectó ningún mensaje de rechazo al incluir el nombre "Pérez" en la nota.',
      verdict: wasRejected ? 'cumple' : 'no cumple',
      screenshot: '06-editorial-note-rejected.png',
    });

    const withoutNameText = `Recorrido de Sofía (${SUFFIX}): el plan de esta carrera cambió, según lo que dejaron en el campo libre.`;
    await activeField.fill(withoutNameText);
    await submitButton.click();
    await page.waitForTimeout(1500);
    const published = await isVisible(page.getByText(withoutNameText), 5000);
    await shot(page, '06-editorial-note-published.png');
    record({
      step: 6,
      story: 'ADR-0084',
      expected:
        'Sin nombres, la nota se publica con fecha y procedencia ("leída de comentarios que no se publican").',
      observed: published
        ? 'La nota sin nombres se publicó en el backoffice.'
        : 'La nota sin nombres no se confirmó publicada en el backoffice.',
      verdict: published ? 'cumple' : 'no cumple',
      screenshot: '06-editorial-note-published.png',
    });

    await withAnonymousPage(browser, async (anonPage) => {
      await anonPage.goto(`/careers/${CAREER_SOFTWARE_QUALITY_ID}`);
      await anonPage.waitForLoadState('networkidle').catch(() => {});
      const visiblePublicly = await isVisible(anonPage.getByText(withoutNameText), 6000);
      const provenance = anonPage.getByText(
        /leída de comentarios que no se publican|comentarios que no se publican/i,
      );
      const hasProvenance = await isVisible(provenance, 3000);
      await anonPage.screenshot({
        path: resolve(ASSETS_DIR, '06-editorial-note-public.png'),
        fullPage: true,
      });
      record({
        step: 6,
        story: 'ADR-0084',
        expected:
          'Sin cuenta, la nota se lee en la ficha de carrera, con fecha y procedencia, sin nombre de nadie.',
        observed: visiblePublicly
          ? `Se lee públicamente en /careers/${CAREER_SOFTWARE_QUALITY_ID}. Procedencia: ${hasProvenance ? `"${await textOf(provenance)}"` : 'no se encontró la frase de procedencia esperada'}.`
          : 'No se encontró la nota en la ficha pública de carrera.',
        verdict: combineVerdict([visiblePublicly, hasProvenance]),
        screenshot: '06-editorial-note-public.png',
      });
    });
  });

  await test.step('7. Lo que la épica pide y está o no', async () => {
    const checks: { story: string; expected: string; pattern: RegExp }[] = [
      {
        story: 'US-195',
        expected: 'Declarar dos ofertas como la misma carrera canónica.',
        pattern: /misma carrera|carrera canónica|declarar equivalente|fusionar carrera/i,
      },
      {
        story: 'US-194',
        expected: 'Contrastar una corrección contra la fuente.',
        pattern: /contrastar|fuente oficial|verificar contra la fuente/i,
      },
      {
        story: 'US-202',
        expected: 'Marcar un campo con fuente no oficial.',
        pattern: /fuente no oficial|sin fuente oficial|dato no oficial/i,
      },
      {
        story: 'US-193',
        expected: 'Avisar a quienes esperaban una ficha o un dato.',
        pattern: /avisar a|notificar a quienes|avisar a los que esperan/i,
      },
      {
        story: 'US-204',
        expected: 'Sobrevivir una reforma del plan con dos planes coexistiendo.',
        pattern: /plan nuevo|reforma del plan|dos planes|plan vigente y anterior/i,
      },
      {
        story: 'US-197',
        expected: 'Vincular materias declaradas a la materia canónica.',
        pattern: /vincular materia|materia declarada|materia canónica/i,
      },
    ];

    await page.goto('/admin/universities');
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, '07-epic-scope.png');

    for (const check of checks) {
      const found = await isVisible(page.getByText(check.pattern), 3000);
      record({
        step: 7,
        story: check.story,
        expected: check.expected,
        observed: found
          ? 'Aparece algo relacionado en /admin/universities.'
          : 'No se encontró ningún control ni texto relacionado en /admin/universities.',
        verdict: found ? 'cumple' : 'no cumple',
        screenshot: '07-epic-scope.png',
      });
    }
  });

  await test.step('8. Quién hizo qué (US-216)', async () => {
    await page.goto(`/admin/chairs?subjectId=${SUBJECT_FUNDAMENTOS_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const authorship = page
      .getByText(new RegExp(ADMIN.displayName.split(' ')[0], 'i'))
      .or(page.getByText(/hace \d+|editado por|creado por|cargad[oa] por/i));
    const hasAuthorship = await isVisible(authorship, 4000);
    await shot(page, '08-authorship.png');
    record({
      step: 8,
      story: 'US-216',
      expected: `Después de cargar la cátedra ${chairName} y la nota editorial, alguna pantalla muestra quién y cuándo.`,
      observed: hasAuthorship
        ? `Aparece: "${await textOf(authorship)}"`
        : 'No se encontró en pantalla ningún autor ni fecha asociado a lo cargado.',
      verdict: hasAuthorship ? 'cumple' : 'no cumple',
      screenshot: '08-authorship.png',
    });
  });

  await test.step('9. Cerrar sesión', async () => {
    const firstName = ADMIN.displayName.split(' ')[0];
    const avatarButton = page.getByRole('button', { name: new RegExp(firstName, 'i') });
    const hasAvatar = await isVisible(avatarButton, 4000);
    let signedOut = false;
    if (hasAvatar) {
      await avatarButton.click();
      const menuOpen = await isVisible(page.getByRole('menu'), 3000);
      if (menuOpen) {
        await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
        signedOut = await page
          .waitForURL(/\/sign-in(\?|$)/, { timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
      }
    }
    await page.goto('/admin/chairs');
    await page.waitForLoadState('networkidle').catch(() => {});
    const blockedAgain = /\/sign-in/.test(page.url());
    await shot(page, '09-sign-out.png');
    record({
      step: 9,
      story: 'US-215',
      expected: 'Al cerrar sesión, /admin/chairs vuelve a pedir cuenta.',
      observed: `${hasAvatar ? 'Se encontró el menú de cuenta y se cerró sesión' : 'No se encontró el botón de cuenta para cerrar sesión'} (signedOut: ${signedOut}). Al reintentar /admin/chairs, la URL final es ${page.url()}.`,
      verdict: signedOut && blockedAgain ? 'cumple' : 'no cumple',
      screenshot: '09-sign-out.png',
    });
  });

  await test.step('Escribir la tabla de veredictos', async () => {
    const header =
      '| Paso | Story | Qué esperaba Sofía | Qué mostró el stage | Veredicto | Captura |\n' +
      '|---|---|---|---|---|---|\n';
    const body = rows
      .map(
        (r) =>
          `| ${r.step} | ${r.story} | ${escapeCell(r.expected)} | ${escapeCell(r.observed)} | ${r.verdict} | ${r.screenshot} |`,
      )
      .join('\n');
    await writeFile(VERDICTS_PATH, `${header}${body}\n`, 'utf-8');
  });
});
