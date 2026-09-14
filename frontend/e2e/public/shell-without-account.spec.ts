import { expect, type Page, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * El catálogo y las fichas vivían con un header mínimo, separado del shell autenticado. Este
 * spec sostiene que ahora comparten un solo shell (barra lateral + topbar) con sesión opcional:
 * el mismo sidebar sin cuenta y con cuenta, cambiando solo lo que depende de tener una.
 *
 * Corre también en el proyecto `mobile` (viewport de celular, #412): por debajo de `lg` el
 * sidebar no se renderiza, así que "Método" y "Mis aportes" (que solo viven ahí) no aplican en
 * ese viewport. `hasSidebar` gatea esas dos aserciones; el resto (Explorar, Ingresar, iniciales)
 * tiene su propio camino a cada viewport y se afirma siempre.
 */

const TUDCS_CAREER_ID = '00000002-0000-4000-a000-000000000003';

function hasSidebar(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

test.describe('El shell del catálogo, con y sin cuenta', () => {
  test('E1 de US-222: sin cuenta, el sidebar ofrece Explorar y Método, no Mis aportes, y el topbar ofrece Ingresar', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto('/universities');
    await expect(page.getByRole('heading', { name: 'Universidades', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    // "Explorar" tiene un camino siempre visible: el item del sidebar (desktop) o el link fijo
    // del topbar por debajo de `lg` (mobile), nunca los dos a la vez.
    await expect(page.getByRole('link', { name: 'Explorar' })).toBeVisible();
    if (hasSidebar(page)) {
      await expect(page.getByRole('link', { name: 'Método' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Mis aportes' })).toHaveCount(0);
    }
    // toBeVisible pasa igual sobre un elemento clipeado por un ancestro (ej. desbordando el
    // topbar a un lado): toBeInViewport confirma que además cae dentro del viewport real.
    await expect(page.getByRole('link', { name: /^ingresar$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^ingresar$/i })).toBeInViewport();

    // La garantía de leer sin cuenta (US-168) exige que entrar directo a una ficha no dispare
    // ningún redirect ni modal a Ingresar: el shell se muestra igual, con Ingresar como link.
    await page.goto(`/careers/${TUDCS_CAREER_ID}`);
    await expect(page).toHaveURL(new RegExp(`/careers/${TUDCS_CAREER_ID}$`));
    await expect(page.getByRole('link', { name: 'Explorar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^ingresar$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^ingresar$/i })).toBeInViewport();
  });

  test('con una cuenta de alumno, el sidebar ofrece Mis aportes y el topbar ya no ofrece Ingresar', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    await page.goto('/universities');
    await expect(page.getByRole('heading', { name: 'Universidades', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    if (hasSidebar(page)) {
      await expect(page.getByRole('link', { name: 'Mis aportes' })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /^ingresar$/i })).toHaveCount(0);
    await expect(page.getByTitle('Lucia Mansilla')).toBeVisible();
  });
});
