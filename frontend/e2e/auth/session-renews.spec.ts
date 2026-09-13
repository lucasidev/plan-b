import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * El refresh silencioso de la sesión (ADR-0095, hallazgo L11 de la story US-229): sin él, el
 * access token de 15 minutos vence y el guard de layout manda a Ingresar aunque el refresh
 * siga vivo. El middleware lo renueva antes de renderizar una ruta con cuenta, así que una
 * sesión con `planb_refresh` pero sin `planb_session` sigue adentro; una sesión sin ninguna
 * de las dos va a Ingresar, como siempre.
 */

test.describe('el refresh silencioso renueva la sesión', () => {
  test('sin planb_session pero con planb_refresh, /home renueva y sigue adentro', async ({
    page,
    context,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    await context.clearCookies({ name: 'planb_session' });

    await page.goto('/home');
    await expect(page).toHaveURL(/\/home$/);

    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === 'planb_session')).toBe(true);
  });

  test('sin ninguna cookie de sesión, /home manda a Ingresar', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/home');
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
