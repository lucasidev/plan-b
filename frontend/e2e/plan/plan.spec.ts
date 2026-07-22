import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * Plan E2E (US-046). Frontend with mocks (no simulation backend yet; US-016 + US-023
 * pending).
 *
 * Covers:
 *  - Login Lucía + navigate to /plan from the sidebar.
 *  - Header + tabs render.
 *  - Default "En curso" tab: subject list for the year + stats + weekly calendar.
 *  - "Borrador" tab: switch via URL ?tab=draft, renders mock drafts.
 *  - "Publicar plan" modal opens with checklist on click "Publicar".
 *  - "Agregar materia" drawer opens with filterable catalog.
 *
 * We do not exercise real publish nor mutations (no backend); the spec only checks the
 * visual layout + pure client interactions.
 */

test.describe('Planificar (US-046)', () => {
  // En dev frontend (turbopack JIT) el primer hit a /plan compila ~10s; sumado a sign-in
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
    await page.getByRole('link', { name: /plan/i }).first().click();
    await expect(page).toHaveURL(/\/plan/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /tu período, ajustable/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('tab "En curso" muestra materias del año, el panel y el calendario', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /materias del año/i })).toBeVisible();
    // ISW302 aparece tanto en la lista de materias (sidebar) como en bloques del calendario
    // (varios días). Verificamos que esté visible al menos una vez sin imponer strict mode.
    await expect(page.getByText('ISW302').first()).toBeVisible();
    await expect(page.getByText('INT302').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /distribución semanal/i })).toBeVisible();
    // El panel de métricas (US-016) reacciona a las materias que el alumno suma desde el drawer,
    // no al borrador activo (que es mock sin id real, US-023). Al cargar el tab arranca sin
    // materias en la simulación, así que invita a sumarlas en vez de mostrar stats: las métricas
    // reales se ejercitan agregando una materia (ver el test del drawer más abajo).
    await expect(page.getByText(/sumá materias a tu simulación/i).first()).toBeVisible();
  });

  test('cambio a tab "Borradores" via click URL', async ({ page }) => {
    await page.getByRole('link', { name: /borradores/i }).click();
    // Timeout explícito: desde US-016 la página es `force-dynamic` y hace un fetch autenticado al
    // simulador en cada render, así que el round-trip del RSC al cambiar de tab tarda mas que el
    // default de 5s cuando el backend viene cargado.
    await expect(page).toHaveURL(/tab=draft/, { timeout: 20_000 });
    await expect(page.getByText(/borrador 2027/i).first()).toBeVisible();
  });

  test('drawer "Agregar materia" abre con catálogo filtrable', async ({ page }) => {
    await page.getByRole('button', { name: /\+ agregar materia/i }).click();

    const drawer = page.getByRole('dialog', { name: /agregar materia/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: /agregar materia/i })).toBeVisible();
    await expect(drawer.getByPlaceholder(/buscar/i)).toBeVisible();

    // Desde US-016 el drawer consume GET /api/me/simulator/available en vez del mock. No afirmamos
    // una materia puntual a propósito: casi todas las del plan seedeado las consume algún otro spec
    // de la suite (los de reseñas crean enrollments de MAT102, ALG101, INT101... para poder
    // reseñar), y una materia ya cursada correctamente deja de ofrecerse en el simulador. Afirmar
    // un código concreto hace que este test dependa del orden de la suite. Afirmamos el
    // comportamiento: hay materias disponibles, con su carga horaria, dato que solo viene del
    // backend real.
    await expect(drawer.getByText(/hs\/sem/).first()).toBeVisible();
    await expect(drawer.getByText('+ Sumar').first()).toBeVisible();

    await drawer.getByPlaceholder(/buscar/i).fill('xyz999');
    await expect(drawer.getByText(/no encontramos/i)).toBeVisible();
  });

  test('publicar un borrador abre modal con checklist de validaciones', async ({ page }) => {
    await page.goto('/plan?tab=draft');
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
