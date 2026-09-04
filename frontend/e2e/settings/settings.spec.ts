import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Ajustes (US-072) + modal de cambiar contraseña (US-079-i frontend).
 *
 * Cubre:
 *  - Login con una cuenta propia (creada por API) → navegar a /settings desde sidebar.
 *  - Toggle notificación por email: cambio se persiste (reload trae el nuevo valor).
 *  - Cambio de tema: select Dark → la clase `dark` aparece en <html>.
 *  - Click "Cambiar contraseña" abre el modal con los 3 PasswordField.
 *  - Cancelar el modal lo cierra sin tocar nada.
 *
 * El happy path real de cambio de contraseña (PATCH + sign-out + redirect) dejaría a la cuenta
 * con una password distinta a la que borra el afterEach. No lo ejercitamos acá: el endpoint
 * tiene su cobertura en backend integration tests (ChangePasswordEndpointTests).
 */

// Cada test trae su propia cuenta (createStudent/deleteStudent) en vez de compartir LUCIA: en
// paralelo, dos tests logueados con la misma cuenta corrían el PATCH que crea su UserSettings a
// la vez, uno perdía contra el índice único y el rollback del optimistic UI hacía fallar el assert.
test.describe('Ajustes (US-072 + US-079-i modal)', () => {
  // En CI dev frontend (turbopack JIT) compila /settings la primera vez (~10s) y el
  // sign-in dev tarda ~4s. Bumpeamos el budget para que el beforeEach + el body de cada
  // test tengan margen real.
  test.setTimeout(180_000);

  let student: CreatedStudent;

  test.beforeEach(async ({ page, request }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-settings' });

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    await page.getByRole('link', { name: /^ajustes$/i }).click();
    await expect(page).toHaveURL(/\/settings$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /^ajustes$/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });
  });

  test.afterEach(async ({ request }) => {
    await deleteStudent(request, { email: student.email, password: student.password });
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

    // Esperamos la respuesta del server action antes del reload: sin esto, el reload puede
    // ganarle a la persistencia (optimistic UI) y traer el valor viejo.
    const saved = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        r.request().headers()['next-action'] !== undefined &&
        r.ok(),
    );
    await toggle.click();
    await saved;
    await expect(toggle).toHaveAttribute('data-state', wasChecked ? 'unchecked' : 'checked');

    await page.reload();
    await expect(toggle).toHaveAttribute('data-state', wasChecked ? 'unchecked' : 'checked');
  });

  test('cambiar tema a Oscuro aplica la clase dark en <html>', async ({ page }) => {
    const themeTrigger = page.getByRole('combobox', { name: /tema visual/i });
    await themeTrigger.click();
    await page.getByRole('option', { name: /^oscuro$/i }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);
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

    await dialog.getByLabel(/contraseña actual/i).fill(student.password);
    await dialog.getByLabel(/^nueva contraseña$/i).fill('nueva-password-12c');
    await dialog.getByLabel(/confirmar nueva contraseña/i).fill('distinta-password-12c');
    await dialog.getByRole('button', { name: /^cambiar contraseña$/i }).click();

    await expect(dialog.getByText(/no coinciden/i)).toBeVisible();
  });
});
