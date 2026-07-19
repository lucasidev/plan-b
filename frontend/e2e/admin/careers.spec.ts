import { expect, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E para US-061 (backoffice de carreras y planes de estudio de una universidad).
 *
 * Flujo determinístico sobre la universidad seed (UNSTA): el admin entra al listado de carreras, da
 * de alta una carrera nueva, entra a su detalle, le agrega un plan de estudios y ejercita la
 * transición de estado del plan (deprecar/reactivar). Usa un tag random para el nombre/slug de la
 * carrera y el identificador del plan, así corridas repetidas no chocan en la DB compartida.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';

async function signIn(page: import('@playwright/test').Page, persona: typeof ADMIN) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

test.describe('Backoffice de carreras y planes de estudio (US-061)', () => {
  test.setTimeout(120_000);

  test('el admin crea una carrera, le agrega un plan y depreca/reactiva el plan', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    await page.goto(`/admin/universities/${UNSTA_ID}/careers`);
    await expect(page.getByRole('heading', { name: /carreras/i })).toBeVisible({
      timeout: 30_000,
    });

    // Alta de la carrera.
    await page.getByRole('link', { name: /nueva carrera/i }).click();
    await expect(page).toHaveURL(/\/careers\/new$/, { timeout: 30_000 });

    const tag = Math.random().toString(36).slice(2, 8);
    const careerName = `Carrera E2E ${tag}`;
    await page.getByLabel(/nombre de la carrera/i).fill(careerName);
    await page.getByLabel(/^slug$/i).fill(`carrera-e2e-${tag}`);
    await page.getByLabel(/tipo de título/i).selectOption('Grado');
    await page.getByLabel(/duración/i).fill('5');
    await page.getByLabel(/modalidad/i).selectOption('Cuatrimestral');
    await page.getByRole('button', { name: /crear carrera/i }).click();

    // Vuelve al listado y la carrera recién creada aparece.
    await expect(page).toHaveURL(/\/careers$/, { timeout: 30_000 });
    await expect(page.getByText(careerName)).toBeVisible({ timeout: 15_000 });

    // Entra al detalle desde el link del nombre.
    await page.getByRole('link', { name: careerName }).click();
    await expect(page.getByRole('heading', { name: careerName })).toBeVisible({
      timeout: 30_000,
    });

    // Alta de un plan de estudios en el detalle.
    const planYear = String(new Date().getFullYear());
    const planLabel = `plan-e2e-${tag}`;
    await page.getByLabel(/^año$/i).fill(planYear);
    await page.getByLabel(/identificador/i).fill(planLabel);
    await page.getByRole('button', { name: /agregar plan/i }).click();

    await expect(page.getByText(planYear).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/vigente/i).first()).toBeVisible({ timeout: 15_000 });

    // Transición de estado del plan: deprecar y reactivar.
    await page
      .getByRole('button', { name: /deprecar/i })
      .first()
      .click();
    await expect(page.getByText(/deprecado/i).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /reactivar/i }).click();
    await expect(page.getByText(/vigente/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
