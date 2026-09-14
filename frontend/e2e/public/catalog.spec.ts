import { expect, type Page, test } from '@playwright/test';

/**
 * E2E del catálogo público (US-001): universidades → carreras → planes → materias, sin login.
 * Recorre UNSTA (seed determinístico, `AcademicSeedData.cs`) porque es la única universidad con
 * datos en los 4 niveles: la Tecnicatura Universitaria en Desarrollo y Calidad de Software
 * (TUDCS) es la única carrera con materias cargadas (plan 2018, `AcademicSeedData.Subjects`).
 *
 * Usamos `page.goto` directo a los ids seedeados (determinísticos entre runs) en vez de
 * encadenar clicks: más robusto contra flake de hidratación en navegaciones multi-nivel. Un
 * segundo test cubre que los links de la lista de universidades efectivamente navegan.
 */

const UNSTA_SLUG = 'unsta';
const TUDCS_CAREER_ID = '00000002-0000-4000-a000-000000000003';
const TUDCS_PLAN_2018_ID = '00000003-0000-4000-a000-000000000003';

/**
 * El link de una universidad en la lista de `/universities`, acotado al `listitem` que la
 * contiene (ADR-0096): la columna "Lo que los datos dicen" puede nombrar a la misma universidad
 * en sus propios links (la más elegida, quien más avanza), así que buscar por nombre en toda la
 * página resuelve más de un elemento (mismo patrón que 87c05bf8).
 */
function universityLink(page: Page, name: string | RegExp) {
  return page.getByRole('listitem').filter({ hasText: name }).getByRole('link');
}

test.describe('Catálogo público (US-001)', () => {
  test.setTimeout(120_000);

  test('visitante anónimo navega de universidades a materias', async ({ page }) => {
    await page.goto('/universities');
    await expect(page.getByRole('heading', { name: 'Universidades', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      universityLink(page, /universidad del norte santo tomás de aquino/i),
    ).toBeVisible();

    await page.goto(`/universities/${UNSTA_SLUG}/careers`);
    await expect(
      page.getByRole('heading', {
        name: /universidad del norte santo tomás de aquino/i,
        level: 1,
      }),
    ).toBeVisible({ timeout: 30_000 });
    // .first(): "Facultades y carreras" siempre la lista; si además junta reseñas suficientes
    // para "Por dónde empezar", el mismo nombre aparece dos veces en la página.
    await expect(
      page
        .getByRole('link', {
          name: /tecnicatura universitaria en desarrollo y calidad de software/i,
        })
        .first(),
    ).toBeVisible();

    await page.goto(`/careers/${TUDCS_CAREER_ID}/plans`);
    await expect(page.getByRole('heading', { name: 'Planes de estudio', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    const planLink = page.getByRole('link', { name: /plan 2018/i });
    await expect(planLink).toBeVisible();
    await expect(planLink.getByText(/vigente/i)).toBeVisible();

    await page.goto(`/plans/${TUDCS_PLAN_2018_ID}/subjects`);
    await expect(page.getByRole('heading', { name: 'Plan 2018', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Año 1')).toBeVisible();
    // Link completo (código + nombre): "Algoritmos y Paradigmas" no es prefijo de ningún otro
    // nombre del plan (a diferencia de "Álgebra I" / "Álgebra II"), así que el name del link es
    // único sin ambigüedad de strict mode.
    await expect(page.getByRole('link', { name: '101 Algoritmos y Paradigmas' })).toBeVisible();
  });

  test('el link de la lista de universidades navega a sus carreras', async ({ page }) => {
    await page.goto('/universities');
    await universityLink(page, /universidad del norte santo tomás de aquino/i).click();
    await expect(page).toHaveURL(new RegExp(`/universities/${UNSTA_SLUG}/careers$`), {
      timeout: 30_000,
    });
  });

  test('desde la lista de carreras se llega a la ficha, y ahí ve el plan inline', async ({
    page,
  }) => {
    // La ficha de carrera se construyó después que la lista, y la lista seguía saltándosela para
    // ir directo a los planes: una pantalla a la que solo se llega tipeando la URL es una que
    // nadie lee. Este test es el que sostiene que esté enganchada.
    await page.goto(`/universities/${UNSTA_SLUG}/careers`);
    // .first(): mismo motivo que el test de arriba, "Facultades y carreras" antes que "Por dónde empezar".
    await page
      .getByRole('link', { name: /tecnicatura universitaria en desarrollo y calidad de software/i })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/careers/${TUDCS_CAREER_ID}$`), { timeout: 30_000 });
    await expect(
      page.getByRole('heading', {
        name: /tecnicatura universitaria en desarrollo y calidad de software/i,
        level: 1,
      }),
    ).toBeVisible();

    // El plan vigente se lee inline en la ficha (ya no hace falta salir a /careers/[id]/plans).
    await expect(page.getByText('El plan 2018')).toBeVisible();
    await expect(page.getByText('Año 1')).toBeVisible();
    await expect(page.getByRole('link', { name: '101 Algoritmos y Paradigmas' })).toBeVisible();
  });

  test('US-222: la lente de Carreras agrupa lo que se dicta en más de una institución (ADR-0096)', async ({
    page,
  }) => {
    // La Tecnicatura de UNSTA comparte carrera canónica con UNT y UTN-FRT
    // (CanonicalCareerGroupings.cs, "Tecnicatura o técnico en programación"): dato determinístico
    // del seed, no depende de que alguien haya reseñado nada.
    await page.goto('/careers');
    await expect(page.getByRole('heading', { name: 'Carreras', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole('heading', { name: 'En más de una institución', level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Tecnicatura o técnico en programación', level: 3 }),
    ).toBeVisible();

    const tudcsLink = page.getByRole('link', {
      name: /tecnicatura universitaria en desarrollo y calidad de software/i,
    });
    await expect(tudcsLink).toBeVisible();
    await tudcsLink.click();
    await expect(page).toHaveURL(new RegExp(`/careers/${TUDCS_CAREER_ID}$`), { timeout: 30_000 });
  });

  test('US-222: /careers muestra primero "en más de una institución" y no mezcla sus grupos con "en una sola"', async ({
    page,
  }) => {
    await page.goto('/careers');
    await expect(page.getByRole('heading', { name: 'Carreras', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const sectionHeadings = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(sectionHeadings).toEqual(['En más de una institución', 'En una sola institución']);

    // El grupo canónico multi-institución (Tecnicatura o técnico en programación) no puede
    // reaparecer como encabezado adentro de la lista compacta de "en una sola institución".
    const singleSection = page.locator('section', {
      has: page.getByRole('heading', { name: 'En una sola institución' }),
    });
    await expect(
      singleSection.getByRole('heading', { name: 'Tecnicatura o técnico en programación' }),
    ).toHaveCount(0);
  });
});
