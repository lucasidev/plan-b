import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de la entrada en `/` (US-221, SC-004).
 *
 * Cubre lo propio de esta pantalla: que sea la URL canónica del proyecto (un usuario con sesión
 * **no** se redirige a /home) y que lo único que cambie con la sesión sea el topbar.
 *
 * Lo que la entrada muestra y adónde lleva lo cubre `e2e/public/path-to-the-ficha.spec.ts`, que
 * recorre el camino entero hasta los conteos de una cátedra sin usar sesión en ningún momento.
 */

test.describe('La entrada (US-221)', () => {
  test('visitante anónimo ve la entrada y no se redirige a /home', async ({ page }) => {
    await page.goto('/');

    // El H1 del hero renderea (SSR): evidencia de que no hubo redirect a /home.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/una anécdota/i, {
      timeout: 15_000,
    });

    // Topbar anónimo: CTAs de ingreso / registro. Scopeado al <header> (banner):
    // "Crear cuenta" también existe como CTA final de la página.
    const topbar = page.getByRole('banner');
    await expect(topbar.getByRole('link', { name: 'Ingresar', exact: true })).toBeVisible();
    await expect(topbar.getByRole('link', { name: 'Crear cuenta', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /ir a mi inicio/i })).toHaveCount(0);
  });

  test('Lucía logueada ve la misma entrada, con el topbar "Ir a mi inicio"', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/una anécdota/i);
    await expect(page.getByRole('link', { name: /ir a mi inicio/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ingresar', exact: true })).toHaveCount(0);
  });

  // Los dos CTA del hero son de lectura: quien llega todavía no sabe qué es esto, y pedirle cuenta
  // antes de mostrarle un dato invierte el orden de la tesis.
  test('el CTA del hero lleva a explorar el catálogo, no a registrarse', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explorar carreras y materias/i }).click();
    await expect(page).toHaveURL(/\/universities$/);
  });

  test('el nav "Una ficha" ancla a la muestra real', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Una ficha', exact: true }).click();
    await expect(page).toHaveURL(/#sample$/);
    await expect(page.locator('#sample')).toBeVisible();
  });

  /**
   * US-221 E3: el bloque "qué es plan-b" explica el producto sin vocabulario de tesis, y desde ahí
   * se llega a Explorar y a Método.
   */
  test('el bloque "qué es esto" no usa jerga de producto y lleva a explorar y a método', async ({
    page,
  }) => {
    await page.goto('/');

    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText).not.toMatch(/instrumento de presión|convergencia|piso de publicación|wilson/i);

    await expect(page.getByRole('link', { name: /explorar carreras y materias/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /método/i })).toBeVisible();
  });
});
