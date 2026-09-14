import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * El refresh silencioso de la sesión (ADR-0095, hallazgo L11 de la story US-229): sin él, el
 * access token de 15 minutos vence y el guard de layout manda a Ingresar aunque el refresh
 * siga vivo. El middleware lo renueva antes de renderizar una ruta con cuenta: una sesión con
 * `planb_refresh` vigente pero sin `planb_session` sigue adentro y rota las dos cookies; una
 * sesión con `planb_refresh` ya revocado por el backend va a Ingresar, igual que sin ninguna
 * cookie.
 */

test.describe('el refresh silencioso renueva la sesión', () => {
  test('sin planb_session pero con planb_refresh, /home renueva y rota las dos cookies', async ({
    page,
    context,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    const refreshBefore = (await context.cookies()).find(
      (cookie) => cookie.name === 'planb_refresh',
    )?.value;

    await context.clearCookies({ name: 'planb_session' });

    await page.goto('/home');
    await expect(page).toHaveURL(/\/reviews\/mine$/);

    const cookiesAfter = await context.cookies();
    const sessionAfter = cookiesAfter.find((cookie) => cookie.name === 'planb_session');
    const refreshAfter = cookiesAfter.find((cookie) => cookie.name === 'planb_refresh');

    expect(sessionAfter).toBeTruthy();
    // La rotación (ADR-0023) tiene que llegar al jar del navegador, no solo al backend: si
    // el valor no cambió, el middleware renovó en el aire pero nunca reenvió la cookie nueva.
    expect(refreshAfter?.value).toBeTruthy();
    expect(refreshAfter?.value).not.toBe(refreshBefore);
  });

  test('con planb_session borrada y planb_refresh revocado, /home manda a Ingresar', async ({
    page,
    context,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    const revokedRefresh = (await context.cookies()).find(
      (cookie) => cookie.name === 'planb_refresh',
    );
    if (!revokedRefresh) {
      throw new Error('no se pudo capturar planb_refresh antes de cerrar sesión');
    }

    // Sign-out revoca este refresh en el backend (Redis) y, de paso, limpia las dos cookies
    // del jar con su propio Set-Cookie de borrado. Lo reinsertamos a mano para dejar
    // exactamente el escenario que el middleware tiene que degradar: sesión ausente, refresh
    // presente pero ya muerto del lado del backend.
    await context.request.post('/api/identity/sign-out');
    await context.addCookies([revokedRefresh]);

    await page.goto('/home');
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
