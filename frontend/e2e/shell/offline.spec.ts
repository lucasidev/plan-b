import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E del estado offline (US-039-f). Usa `context.setOffline` de Playwright para emular la
 * caída de red y verifica que el banner global del shell `(member)` aparece/se retira, y que
 * NO se cuela en la landing pública.
 *
 * No se corre en este entorno (necesita el dev stack + browsers); corre en CI como el resto
 * de la suite E2E.
 */
test.describe('estado offline (US-039-f)', () => {
  test('el banner aparece al perder conexión en el shell y se retira al volver', async ({
    page,
    context,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // Con conexión: sin banner.
    await expect(page.getByText(/sin conexión/i)).toHaveCount(0);

    // Se cae la red: aparece el aviso (el hook debounce 500ms).
    await context.setOffline(true);
    await expect(page.getByText(/sin conexión/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // Vuelve la red: banner verde "Conexión restablecida".
    await context.setOffline(false);
    await expect(page.getByText(/conexión restablecida/i)).toBeVisible({ timeout: 5_000 });
  });

  test('el banner NO aparece en la landing pública', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    // El banner es solo del shell (member); la landing no lo monta.
    await expect(page.getByText(/sin conexión/i)).toHaveCount(0);
  });
});
