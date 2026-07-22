import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de la landing pública en `/` (US-054-f). Cubre los scenarios críticos:
 *   - visitante anónimo ve la landing (H1 + CTAs anónimos) y NO se redirige a /home
 *   - usuario logueado ve la MISMA landing, pero el topbar cambia a "Ir a mi inicio"
 *   - el CTA del hero navega a /sign-up
 *   - el nav interno hace scroll a la sección con ancla real (#features)
 *
 * El caso logueado reusa el login real de Lucía (persona VerifiedActive, aterriza
 * en /home). No modifica estado persistente: solo abre sesión.
 */

test.describe('landing pública (US-054-f)', () => {
  test('visitante anónimo ve la landing y no se redirige a /home', async ({ page }) => {
    await page.goto('/');

    // El H1 del hero renderea (SSR): evidencia de que no hubo redirect a /home.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/pasaron por ahí/i, {
      timeout: 15_000,
    });

    // Topbar anónimo: CTAs de ingreso / registro. Scopeado al <header> (banner):
    // "Crear cuenta" también existe como CTA final de la página.
    const topbar = page.getByRole('banner');
    await expect(topbar.getByRole('link', { name: 'Ingresar', exact: true })).toBeVisible();
    await expect(topbar.getByRole('link', { name: 'Crear cuenta', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /ir a mi inicio/i })).toHaveCount(0);
  });

  test('Lucía logueada ve la landing con el topbar "Ir a mi inicio"', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // Con sesión, la landing no redirige: se ve igual, solo cambia el topbar.
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/pasaron por ahí/i);
    await expect(page.getByRole('link', { name: /ir a mi inicio/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ingresar', exact: true })).toHaveCount(0);
  });

  test('el CTA "Crear cuenta gratis" del hero navega a /sign-up', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /crear cuenta gratis/i }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test('el nav "Cómo funciona" ancla a la sección #features', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Cómo funciona', exact: true }).click();
    await expect(page).toHaveURL(/#features$/);
    await expect(page.locator('#features')).toBeVisible();
  });
});
