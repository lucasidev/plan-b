import { expect, test } from '@playwright/test';

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

test.describe('Catálogo público (US-001)', () => {
  test.setTimeout(120_000);

  test('visitante anónimo navega de universidades a materias', async ({ page }) => {
    await page.goto('/universities');
    await expect(page.getByRole('heading', { name: 'Universidades', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole('link', { name: /universidad del norte santo tomás de aquino/i }),
    ).toBeVisible();

    await page.goto(`/universities/${UNSTA_SLUG}/careers`);
    await expect(
      page.getByRole('heading', {
        name: /universidad del norte santo tomás de aquino/i,
        level: 1,
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole('link', {
        name: /tecnicatura universitaria en desarrollo y calidad de software/i,
      }),
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
    await page.getByRole('link', { name: /universidad del norte santo tomás de aquino/i }).click();
    await expect(page).toHaveURL(new RegExp(`/universities/${UNSTA_SLUG}/careers$`), {
      timeout: 30_000,
    });
  });
});
