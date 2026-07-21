import { expect, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E para US-064 (backoffice de períodos lectivos de una universidad).
 *
 * Flujo determinístico sobre la universidad seed (UNSTA): el admin da de alta un período lectivo y
 * lo encuentra en el listado por su label computado (el label no lo tipea el admin, lo calcula el
 * backend a partir de year/number/kind). A diferencia de careers.spec (que arma un tag random para
 * un campo de texto libre), la unicidad de un período es (universidad, year, number, kind): no hay
 * campo de texto donde insertar un tag, así que el "tag" es un año random dentro del rango válido
 * (año actual + 1..20). UNSTA ya tiene períodos cuatrimestrales sembrados 2024-2026 (AcademicSeeder),
 * así que un año fijo (ej. "el año actual") chocaría con el seed; el offset random evita esa
 * colisión y las de corridas concurrentes en la DB compartida.
 *
 * Navegación por `goto` (no click en `<Link>`) para llegar derecho al form. Ya no hace falta
 * esperar la hidratación a mano: el botón de submit arranca deshabilitado y se habilita al hidratar
 * (`useHydrated`), así que el `click` de Playwright espera solo.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';

async function signIn(page: import('@playwright/test').Page, persona: typeof ADMIN) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

test.describe('Backoffice de períodos lectivos (US-064)', () => {
  test.setTimeout(120_000);

  test('el admin crea un período lectivo y lo encuentra en el listado por su label', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    await page.goto(`/admin/universities/${UNSTA_ID}/terms/new`);
    await expect(page.getByRole('heading', { name: /nuevo período lectivo/i })).toBeVisible({
      timeout: 30_000,
    });
    const currentYear = new Date().getFullYear();
    const year = currentYear + 1 + Math.floor(Math.random() * 20);
    const label = `${year}-C1`;

    await page.getByLabel(/^año$/i).fill(String(year));
    await page.getByLabel(/número de período/i).fill('1');
    await page.getByLabel(/^cadencia$/i).selectOption('FourMonth');
    await page.getByLabel(/fecha de inicio/i).fill(`${year}-03-01`);
    await page.getByLabel(/fecha de fin/i).fill(`${year}-07-01`);
    await page.getByLabel(/apertura de inscripción/i).fill(`${year}-02-01T00:00`);
    await page.getByLabel(/cierre de inscripción/i).fill(`${year}-02-20T00:00`);
    await page.getByRole('button', { name: /crear período/i }).click();

    // El submit crea el período (server action async). El redirect al listado es un useEffect client
    // (mutación pura, ADR-0046) que puede no dispararse si Playwright submitea en la ventana de
    // hidratación de React (el form se procesa como POST nativo); y el alta tarda un toque en
    // persistir. Reintentamos ir al listado hasta que el período aparezca por su label computado:
    // robusto contra el flake de hidratación y contra el race del submit async (en CI, más lento, un
    // solo goto pegaba antes de que el período estuviera persistido).
    await expect(page).toHaveURL(new RegExp(`/admin/universities/${UNSTA_ID}/terms$`), {
      timeout: 30_000,
    });
    await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: 30_000 });
  });
});
