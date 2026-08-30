import { expect, test } from '@playwright/test';
import { ADMIN, LUCIA } from '../helpers/personas';

// `expect` viene del import; `toHaveURL` es resiliente a soft navigation
// RSC (Server Actions con redirect()) que no dispara "load" event y por
// eso `waitForURL` con default `until: 'load'` puede timeoutear.

/**
 * E2E cross-cutting de los layout guards (US-042 / ADR-0023).
 *
 * Cada route group tiene un layout server-side que chequea sesión vía
 * `getSession()`:
 *   - `(member)`: redirige a /sign-in si NO hay sesión, o si el rol no es alumno.
 *   - `(auth)`:   redirige a donde entra ese rol si SÍ hay sesión (evita re-login).
 *
 * Acá validamos esos dos paths del lado del browser. El backend ya está
 * cubierto en integration tests; este spec da seguridad de que el guard
 * UX no se rompe entre refactors del layout.
 *
 * No es exhaustivo de cada ruta protegida — solo el invariant del guard:
 * /home representa el área (member), /sign-in representa el área (auth).
 */

test.describe('layout guards (ADR-0023)', () => {
  test('sin sesión, /home redirige a /sign-in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/home');
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 10_000 });
  });

  test('con sesión activa, /sign-in redirige a /home', async ({ page }) => {
    // Login primero
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // Intentar volver a /sign-in con sesión activa
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/\/home$/, { timeout: 10_000 });
  });

  test('el admin entra y aterriza en el backoffice, no en el área de alumno', async ({ page }) => {
    // El destino post sign-in salía fijo `/home`, que es del alumno: el admin entraba, el guard
    // de (member) lo echaba a /sign-in por no ser alumno, y el de (auth) lo devolvía a /home por
    // tener sesión. Quedaba dando vueltas, con la sesión creada y sin ninguna pantalla.
    await page.context().clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(ADMIN.email);
    await page.getByLabel(/^contraseña$/i).fill(ADMIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    await expect(page).toHaveURL(/\/admin(\/|$)/, { timeout: 15_000 });
    await expect(page.getByRole('link', { name: /universidades/i })).toBeVisible();

    // Y con sesión de admin, volver a /sign-in tampoco lo manda al área de alumno.
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/\/admin(\/|$)/, { timeout: 10_000 });
  });
});
