import { expect, test } from '@playwright/test';
import { LUCIA, MARTIN, PAULA } from '../helpers/personas';

/**
 * Sample E2E para sign-in (US-028). Cubre:
 *   - happy path: Lucía (verified) → /home
 *   - cuenta no verificada: Martín → error in-form con hint de re-registro
 *   - cuenta deshabilitada: Paula → error específico
 *   - credenciales inválidas → mensaje genérico (anti-enum)
 *
 * No depende de Mailpit ni Redis: sólo POST /api/identity/sign-in.
 * Pensado como sample de cómo escribir un E2E "rápido" (sin estado a
 * resetear) para futuros features.
 */

test.describe('sign-in (US-028)', () => {
  test('Lucía entra con credenciales válidas y aterriza en /home', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await page.waitForURL(/\/home/, { timeout: 10_000 });
    // El dashboard tiene un saludo personalizado.
    await expect(page.getByText(new RegExp(`hola,?\\s+${LUCIA.displayName.split(' ')[0]}`, 'i'))).toBeVisible();
  });

  test('Martín (no verificado) ve error con hint de re-registro', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(MARTIN.email);
    await page.getByLabel(/^contraseña$/i).fill(MARTIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page.getByRole('alert')).toContainText(/no está verificada|no esta verificada/i);
    await expect(page.getByRole('button', { name: /registrate de nuevo/i })).toBeVisible();
  });

  test('Paula (deshabilitada) ve error específico', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(PAULA.email);
    await page.getByLabel(/^contraseña$/i).fill(PAULA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page.getByRole('alert')).toContainText(/suspendida/i);
  });

  test('credenciales inválidas → mensaje genérico anti-enum', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill('contraseña-incorrecta-12');
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // El mensaje no debería distinguir entre "email no existe" vs
    // "password incorrecta" (anti-enum, ADR-0023).
    await expect(page.getByRole('alert')).toContainText(/email o contraseña incorrectos/i);
  });
});
