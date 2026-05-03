import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E del sign-out (US-029).
 *
 * Flow: login → avatar dropdown del sidebar → "Cerrar sesión" → /auth.
 * Después validamos que el guard del layout (member) bloquee volver a
 * /home sin sesión, redirigiendo a /auth.
 *
 * El componente del avatar dropdown está en
 * `components/layout/avatar-menu.tsx`. Es un button con aria-haspopup
 * que abre un menú con role="menu" + role="menuitem" para los items.
 * La acción de "Cerrar sesión" es un <button type="submit"> dentro de
 * un <form action={signOutAction}>.
 *
 * Casos negativos del endpoint backend (sign-out con cookie inválida,
 * sin cookie) se cubren en integration tests, no acá.
 */

test.describe('sign-out (US-029)', () => {
  test('Lucía cierra sesión desde el avatar y queda fuera del área autenticada', async ({
    page,
  }) => {
    // 1. Login → /home
    await page.goto('/auth');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // 2. Abrir el avatar dropdown del sidebar. El button tiene aria-haspopup="menu"
    // y muestra el display name + email. Validamos que el menú abra antes de
    // disparar el segundo click (sino la siguiente acción está racing contra
    // un dropdown que todavía no está en el DOM).
    await page.getByRole('button', { name: /lucia mansilla/i }).click();
    await expect(page.getByRole('menu')).toBeVisible();

    // 3. Click en "Cerrar sesión" del dropdown. Es un submit button dentro
    // de <form action={signOutAction}>; el server action revoca refresh,
    // limpia cookies y redirect('/auth'). Soft navigation RSC, no "load"
    // event — usamos toHaveURL para evitar el timeout de waitForURL.
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/auth(\?|$)/, { timeout: 15_000 });

    // 4. Volver a /home sin sesión → guard del layout (member) redirige a /auth
    await page.goto('/home');
    await expect(page).toHaveURL(/\/auth(\?|$)/, { timeout: 10_000 });
  });
});
