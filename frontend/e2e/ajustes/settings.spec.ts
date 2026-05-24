import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de Ajustes (US-072) + modal de cambiar contraseña (US-079-i frontend).
 *
 * Cubre:
 *  - Login Lucía → navegar a /ajustes desde sidebar.
 *  - Toggle notificación por email: cambio se persiste (reload trae el nuevo valor).
 *  - Cambio de tema: select Dark → la clase `dark` aparece en <html>.
 *  - Click "Cambiar contraseña" abre el modal con los 3 PasswordField.
 *  - Cancelar el modal lo cierra sin tocar nada.
 *
 * El happy path real de cambio de contraseña (PATCH + sign-out + redirect) cambiaría el
 * state global de Lucía. No lo ejercitamos para no contaminar otras specs; el endpoint
 * tiene su cobertura en backend integration tests (ChangePasswordEndpointTests).
 */

test.describe('Ajustes (US-072 + US-079-i modal)', () => {
  test.beforeEach(async ({ page }) => {
    // Login + navegar a /ajustes via sidebar.
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    await page.getByRole('link', { name: /^ajustes$/i }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole('heading', { name: /^ajustes$/i, level: 1 })).toBeVisible();
  });

  test('las 5 secciones renderean', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /notificaciones/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /privacidad/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^idioma$/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^tema$/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^seguridad$/i, level: 2 })).toBeVisible();
  });

  test('toggle de notificación por email persiste tras reload', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /notificaciones por email/i });
    const initialState = await toggle.getAttribute('data-state');
    const wasChecked = initialState === 'checked';

    await toggle.click();
    // Espera el cambio aplicado (optimistic + persist via action).
    await expect(toggle).toHaveAttribute('data-state', wasChecked ? 'unchecked' : 'checked');

    await page.reload();
    await expect(toggle).toHaveAttribute('data-state', wasChecked ? 'unchecked' : 'checked');

    // Restaurar: dejar el toggle como estaba al principio para no contaminar otras specs.
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', wasChecked ? 'checked' : 'unchecked');
  });

  test('cambiar tema a Oscuro aplica la clase dark en <html>', async ({ page }) => {
    const themeTrigger = page.getByRole('combobox', { name: /tema visual/i });
    await themeTrigger.click();
    await page.getByRole('option', { name: /^oscuro$/i }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);

    // Restaurar a auto.
    await themeTrigger.click();
    await page.getByRole('option', { name: /sistema/i }).click();
  });

  test('click en "Cambiar contraseña" abre el modal', async ({ page }) => {
    await page
      .getByRole('button', { name: /cambiar contraseña/i })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /cambiar contraseña/i })).toBeVisible();
    await expect(dialog.getByLabel(/contraseña actual/i)).toBeVisible();
    await expect(dialog.getByLabel(/^nueva contraseña$/i)).toBeVisible();
    await expect(dialog.getByLabel(/confirmar nueva contraseña/i)).toBeVisible();
  });

  test('cancelar el modal lo cierra sin pegarle al backend', async ({ page }) => {
    await page
      .getByRole('button', { name: /cambiar contraseña/i })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('modal rechaza nueva contraseña que no matchea confirmación', async ({ page }) => {
    await page
      .getByRole('button', { name: /cambiar contraseña/i })
      .first()
      .click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel(/contraseña actual/i).fill(LUCIA.password);
    await dialog.getByLabel(/^nueva contraseña$/i).fill('nueva-password-12c');
    await dialog.getByLabel(/confirmar nueva contraseña/i).fill('distinta-password-12c');
    await dialog.getByRole('button', { name: /^cambiar contraseña$/i }).click();

    await expect(dialog.getByText(/no coinciden/i)).toBeVisible();
  });
});
