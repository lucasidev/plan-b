import { expect, test } from '@playwright/test';
import { LUCIA, MARTIN, PAULA } from '../helpers/personas';

/**
 * Sample E2E para sign-in (US-028). Cubre:
 *   - happy path: Lucía (verified) → /home
 *   - cuenta no verificada: Martín → el MISMO error genérico que una credencial mala
 *     (ADR-0076: distinguir "sin verificar" dejaba averiguar si un mail tiene cuenta),
 *     con el reenvío de verificación colgando del error que ven todos (US-021)
 *   - cuenta deshabilitada: Paula → error específico (solo con la contraseña correcta)
 *   - credenciales inválidas → mensaje genérico (anti-enum)
 *
 * Nota sobre `getByRole('alert')`: Next.js inyecta un
 * `<div id="__next-route-announcer__" role="alert">` para anuncios de
 * cambio de ruta accesibles. Strict mode de Playwright detecta dos
 * elementos cuando usamos el role plano. Filtramos por texto del
 * mensaje para apuntar a NUESTRA alert (la de error del form).
 */

test.describe('sign-in (US-028)', () => {
  test('Lucía entra con credenciales válidas y aterriza en /home', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // El layout (member) hace redirect a /home tras autenticar.
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  });

  test('Martín (no verificado) recibe el error genérico, con el reenvío a mano', async ({
    page,
  }) => {
    // ADR-0076: aunque la contraseña sea correcta, "sin verificar" responde igual que una
    // credencial mala; su rescate es el reenvío, que cuelga del error genérico.
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(MARTIN.email);
    await page.getByLabel(/^contraseña$/i).fill(MARTIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    const alert = page
      .getByRole('alert')
      .filter({ hasText: /el mail o la contraseña no coinciden/i });
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(/verificada/i);
    await expect(page.getByRole('button', { name: /reenviar el link/i })).toBeVisible();
  });

  test('Paula (deshabilitada) ve error específico', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(PAULA.email);
    await page.getByLabel(/^contraseña$/i).fill(PAULA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page.getByRole('alert').filter({ hasText: /suspendida/i })).toBeVisible();
  });

  test('credenciales inválidas → mensaje genérico anti-enum', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill('contraseña-incorrecta-12');
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // El mensaje no debería distinguir entre "email no existe" vs
    // "password incorrecta" (anti-enum, ADR-0023).
    await expect(
      page.getByRole('alert').filter({ hasText: /el mail o la contraseña no coinciden/i }),
    ).toBeVisible();
  });
});
