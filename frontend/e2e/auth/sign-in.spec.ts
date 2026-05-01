import { expect, test } from '@playwright/test';
import { LUCIA, MARTIN, PAULA } from '../helpers/personas';

/**
 * Sample E2E para sign-in (US-028). Cubre:
 *   - happy path: Lucía (verified) → /home
 *   - cuenta no verificada: Martín → error in-form con hint de re-registro
 *   - cuenta deshabilitada: Paula → error específico
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
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // El layout (member) hace redirect a /home tras autenticar.
    await page.waitForURL(/\/home$/, { timeout: 10_000 });
  });

  test('Martín (no verificado) ve error con hint de re-registro', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(MARTIN.email);
    await page.getByLabel(/^contraseña$/i).fill(MARTIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: /no está verificada|no esta verificada/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /registrate de nuevo/i })).toBeVisible();
  });

  test('Paula (deshabilitada) ve error específico', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(PAULA.email);
    await page.getByLabel(/^contraseña$/i).fill(PAULA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page.getByRole('alert').filter({ hasText: /suspendida/i })).toBeVisible();
  });

  test('credenciales inválidas → mensaje genérico anti-enum', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill('contraseña-incorrecta-12');
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // El mensaje no debería distinguir entre "email no existe" vs
    // "password incorrecta" (anti-enum, ADR-0023).
    await expect(
      page.getByRole('alert').filter({ hasText: /email o contraseña incorrectos/i }),
    ).toBeVisible();
  });
});
