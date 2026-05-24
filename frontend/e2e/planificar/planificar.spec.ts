import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de Planificar (US-046). Frontend con mocks (sin backend de simulación todavía;
 * US-016 + US-023 pendientes).
 *
 * Cubre:
 *  - Login Lucía + navegar a /planificar desde el sidebar.
 *  - Render del header + tabs.
 *  - Tab "En curso" default: lista de materias del año + stats + calendario semanal.
 *  - Tab "Borrador": cambio vía URL ?tab=borrador, renderea drafts mock.
 *  - Modal "Publicar plan" abre con checklist al click "Publicar".
 *  - Drawer "Agregar materia" abre con catálogo filtrable.
 *
 * No ejercitamos publicar real ni mutaciones (no hay backend); el spec verifica el armado
 * visual + interacciones cliente puras.
 */

test.describe('Planificar (US-046)', () => {
  // En dev frontend (turbopack JIT) el primer hit a /planificar compila ~10s; sumado a sign-in
  // lento en dev (~4s) el beforeEach se acerca al 60s default. Subimos el budget del test
  // para que tenga margen real. En CI (build estático) no aplica.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page, context }) => {
    // Limpiamos cookies para evitar herencia entre tests cuando el dev frontend cachea sesión.
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Sidebar link es "Planificar ⌘3" (incluye shortcut); usamos substring match.
    await page
      .getByRole('link', { name: /planificar/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/planificar/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /tu período, ajustable/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('tab "En curso" muestra materias del año, stats y calendario', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /materias del año/i })).toBeVisible();
    // ISW302 aparece tanto en la lista de materias (sidebar) como en bloques del calendario
    // (varios días). Verificamos que esté visible al menos una vez sin imponer strict mode.
    await expect(page.getByText('ISW302').first()).toBeVisible();
    await expect(page.getByText('INT302').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /distribución semanal/i })).toBeVisible();
    await expect(page.getByText(/semanales/i).first()).toBeVisible();
  });

  test('cambio a tab "Borradores" via click URL', async ({ page }) => {
    await page.getByRole('link', { name: /borradores/i }).click();
    await expect(page).toHaveURL(/tab=borrador/);
    await expect(page.getByText(/borrador 2027/i).first()).toBeVisible();
  });

  test('drawer "Agregar materia" abre con catálogo filtrable', async ({ page }) => {
    await page.getByRole('button', { name: /\+ agregar materia/i }).click();

    const drawer = page.getByRole('dialog', { name: /agregar materia/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: /agregar materia/i })).toBeVisible();
    await expect(drawer.getByPlaceholder(/buscar/i)).toBeVisible();
    await expect(drawer.getByText('ISW401')).toBeVisible();

    await drawer.getByPlaceholder(/buscar/i).fill('xyz999');
    await expect(drawer.getByText(/no encontramos/i)).toBeVisible();
  });

  test('publicar un borrador abre modal con checklist de validaciones', async ({ page }) => {
    await page.goto('/planificar?tab=borrador');
    await expect(page.getByText(/borrador 2027/i).first()).toBeVisible();

    // Click en el primer botón "Publicar" disponible (puede haber drafts vencidos con Activar
    // en lugar de Publicar; el primer borrador 2027 todavía no venció).
    const publishButtons = page.getByRole('button', { name: /^publicar$/i });
    await publishButtons.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /publicar este borrador/i })).toBeVisible();
    await expect(dialog.getByText(/sin choques de horario/i)).toBeVisible();
    await expect(dialog.getByText(/correlativas/i)).toBeVisible();

    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('compare commissions toggle muestra y oculta el comparador', async ({ page }) => {
    const compareBtn = page.getByRole('button', { name: /^comparar comisiones$/i });
    await compareBtn.click();
    await expect(
      page.getByRole('heading', { name: /comparar comisiones · INT302/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /^ocultar comparador$/i }).click();
    await expect(
      page.getByRole('heading', { name: /comparar comisiones · INT302/i }),
    ).not.toBeVisible();
  });
});
