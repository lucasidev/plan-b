import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * `/home` (histórico, US-231) se funde con Mis aportes: el esqueleto del shell (catalogue-shell)
 * dejó la pantalla de Inicio como un simple redirect. Lo que este spec sostiene, al mínimo, es
 * que ese redirect llega a destino y que ahí aparece una pantalla de verdad, no una en blanco a
 * mitad de camino. El contenido que antes vivía en Inicio (cátedras reseñadas, cobertura de la
 * carrera) es responsabilidad de otra pieza, cuando se fusione de verdad con Mis aportes.
 */
test.describe('/home se funde con Mis aportes', () => {
  /**
   * N2 de US-170: nada manda a completar un dato de más antes de dejar ver lo que ya reseñaste.
   * Volver a `/home` después de haber entrado no interpone ninguna pantalla intermedia: termina
   * derecho en Mis aportes.
   */
  test('con sesión, /home termina en Mis aportes', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    await page.goto('/home');
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Mis aportes', level: 1 })).toBeVisible();
  });
});
