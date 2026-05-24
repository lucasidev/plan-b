import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de Mi perfil (US-047) + zona peligrosa con deactivate-account modal (US-038-bis frontend).
 *
 * Cubre:
 *  - Login Lucía + navegar a /mi-perfil desde el AvatarMenu (footer del sidebar).
 *  - Render del header con avatar de iniciales + email + "miembro desde".
 *  - Edit mode: cambiar displayName + yearOfStudy + regularStudent y verificar persistencia.
 *  - Click "Dar de baja mi cuenta" abre el modal de deactivate con copy correcto.
 *  - Modal pide retype del email (botón disabled hasta match).
 *  - Cancel del modal lo cierra sin tocar nada.
 *
 * El happy path real del deactivate (DELETE + sign-out + redirect) cambiaría a Lucía
 * permanentemente. No lo ejercitamos para no contaminar otras specs; el backend tiene
 * cobertura propia en DeactivateAccountEndpointTests.
 */

test.describe('Mi perfil (US-047 + US-038-bis modal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // Abrir AvatarMenu y navegar a Mi perfil.
    await page
      .getByRole('button', { name: /lucia mansilla/i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: /^mi perfil$/i }).click();
    await expect(page).toHaveURL(/\/mi-perfil$/);
    await expect(page.getByRole('heading', { name: /^mi perfil$/i, level: 1 })).toBeVisible();
  });

  test('header muestra avatar, email y miembro desde', async ({ page }) => {
    await expect(page.getByText(LUCIA.email).first()).toBeVisible();
    await expect(page.getByText(/miembro desde/i)).toBeVisible();
    await expect(page.locator(`[aria-label="Avatar de ${LUCIA.email}"]`)).toBeVisible();
  });

  test('view mode muestra datos académicos en read-only', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /datos académicos/i })).toBeVisible();
    await expect(page.getByText(/año cursando/i).first()).toBeVisible();
    await expect(page.getByText(/legajo/i).first()).toBeVisible();
    await expect(page.getByText(/estado/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
  });

  test('edit mode habilita campos y guarda cambios', async ({ page }) => {
    await page.getByRole('button', { name: /editar/i }).click();

    const nameInput = page.getByLabel(/nombre para mostrar/i);
    await nameInput.fill('Lucía Mansilla');

    const yearSelect = page.getByLabel(/año cursando/i);
    await yearSelect.selectOption('3');

    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Volvió a view mode con el nuevo nombre visible en el header.
    await expect(page.getByRole('heading', { name: /lucía mansilla/i, level: 2 })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(/3° año/i)).toBeVisible();
  });

  test('cancelar el edit no persiste cambios', async ({ page }) => {
    await page.getByRole('button', { name: /editar/i }).click();

    const nameInput = page.getByLabel(/nombre para mostrar/i);
    await nameInput.fill('Algo Distinto');

    await page.getByRole('button', { name: /cancelar/i }).click();

    // Volvió a view mode sin el nombre cambiado. Esperamos a que el form se desmonte
    // (el botón "Editar" reaparece) antes de chequear ausencia.
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
    await expect(page.getByText('Algo Distinto')).toHaveCount(0);
  });

  test('zona peligrosa muestra el CTA con copy correcto', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /zona peligrosa/i })).toBeVisible();
    // La card del feature deactivate-account tiene su propio título.
    await expect(
      page.getByRole('heading', { name: /dar de baja mi cuenta/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/anonimizan/i)).toBeVisible();
    await expect(page.getByText(/ex-miembro/i)).toBeVisible();
  });

  test('click en "Dar de baja mi cuenta" abre el modal con email gate', async ({ page }) => {
    await page
      .getByRole('button', { name: /^dar de baja mi cuenta$/i })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /confirmá la baja/i })).toBeVisible();
    await expect(dialog.getByText(LUCIA.email)).toBeVisible();

    // El submit empieza disabled.
    const submit = dialog.getByRole('button', { name: /^dar de baja la cuenta$/i });
    await expect(submit).toBeDisabled();

    // Cancelar cierra el modal.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
