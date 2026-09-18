import { expect, test } from '@playwright/test';
import { ADMIN, LUCIA } from '../helpers/personas';

/** Cerrar sesión debe ser accesible para ambos roles en cada shell y tamaño de pantalla. */

test.describe('sign-out (US-029)', () => {
  test('Lucía cierra sesión desde el avatar y queda fuera del área autenticada', async ({
    page,
  }) => {
    // 1. Login → Mis aportes
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    // 2. Abrir el avatar dropdown del sidebar. El button tiene aria-haspopup="menu"
    // y muestra el display name + email. Validamos que el menú abra antes de
    // disparar el segundo click (sino la siguiente acción está racing contra
    // un dropdown que todavía no está en el DOM).
    await page.getByRole('button', { name: /lucia mansilla/i }).click();
    await expect(page.getByRole('menu')).toBeVisible();

    // 3. El action revoca el refresh y borra las cookies; el cliente navega a Ingresar.
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 15_000 });

    // 4. Volver a /home sin sesión → guard del layout (member) redirige a /sign-in
    await page.goto('/home');
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 10_000 });
  });
});

for (const persona of [ADMIN, LUCIA]) {
  for (const { viewport, placement } of [
    { viewport: { width: 1280, height: 800 }, placement: 'header' },
    { viewport: { width: 393, height: 851 }, placement: 'header' },
    { viewport: { width: 1280, height: 800 }, placement: 'sidebar' },
  ]) {
    test(`${persona === ADMIN ? 'admin' : 'alumno'} cierra sesión desde el catálogo, ${placement} a ${viewport.width}px`, async ({
      page,
      context,
      playwright,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/sign-in');
      await page.getByLabel(/tu email/i).fill(persona.email);
      await page.getByLabel(/^contraseña$/i).fill(persona.password);
      await page.getByRole('button', { name: /^entrar$/i }).click();
      await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 15_000 });
      await page.goto('/universities');

      const refresh = (await context.cookies()).find((cookie) => cookie.name === 'planb_refresh');
      expect(refresh).toBeTruthy();
      const trigger =
        placement === 'header'
          ? page.getByRole('button', { name: /menú de cuenta/i })
          : page.locator('aside').getByRole('button', { name: persona.email });
      await trigger.click();
      await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
      await expect(page).toHaveURL(/\/sign-in(\?|$)/);
      expect(
        (await context.cookies()).filter((cookie) =>
          ['planb_session', 'planb_refresh'].includes(cookie.name),
        ),
      ).toEqual([]);

      const protectedPath = persona === ADMIN ? '/admin/universities' : '/reviews/mine';
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/sign-in(\?|$)/);
      const protectedApi =
        persona === ADMIN ? '/api/reviews/curation/free-texts' : '/api/me/student-profile';
      expect((await page.request.get(protectedApi)).status()).toBe(401);

      // Un refresh capturado antes del cierre tampoco puede volver a abrir la sesión.
      const replay = await playwright.request.newContext();
      try {
        const response = await replay.post(
          new URL('/api/identity/refresh', page.url()).toString(),
          {
            headers: { Cookie: `planb_refresh=${refresh?.value}` },
          },
        );
        expect(response.status()).toBe(401);
      } finally {
        await replay.dispose();
      }
    });
  }
}

for (const placement of ['sidebar', 'header']) {
  test(`admin cierra sesión desde el backoffice, ${placement}`, async ({ page, context }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(ADMIN.email);
    await page.getByLabel(/^contraseña$/i).fill(ADMIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/admin/);
    const trigger =
      placement === 'header'
        ? page.getByRole('button', { name: /menú de cuenta/i })
        : page.locator('aside').getByRole('button', { name: /admin@planb.local/i });
    await trigger.click();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/sign-in(\?|$)/);
    expect(
      (await context.cookies()).filter((cookie) =>
        ['planb_session', 'planb_refresh'].includes(cookie.name),
      ),
    ).toEqual([]);
    await page.goto('/admin/universities');
    await expect(page).toHaveURL(/\/sign-in(\?|$)/);
  });
}

test('si falla el cierre, informa el error y permite reintentar sin fingir una sesión cerrada', async ({
  page,
  context,
}) => {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(ADMIN.email);
  await page.getByLabel(/^contraseña$/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/admin/);
  await page.goto('/universities');
  await page.route('**/api/identity/sign-out', (route) => route.abort('failed'));
  await page.getByRole('button', { name: /menú de cuenta/i }).click();
  await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'No pudimos cerrar la sesión' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/universities$/);
  expect((await context.cookies()).some((cookie) => cookie.name === 'planb_session')).toBe(true);
  await page.unroute('**/api/identity/sign-out');
  await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL(/\/sign-in(\?|$)/);
  expect(
    (await context.cookies()).filter((cookie) =>
      ['planb_session', 'planb_refresh'].includes(cookie.name),
    ),
  ).toEqual([]);
});
