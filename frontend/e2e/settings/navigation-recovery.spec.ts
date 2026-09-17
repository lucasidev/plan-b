import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

test.describe('Recuperación de navegación a Ajustes', () => {
  let student: CreatedStudent;

  test.beforeEach(async ({ page, request }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-navigation-recovery' });

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 30_000 });
  });

  test.afterEach(async ({ request }) => {
    await deleteStudent(request, { email: student.email, password: student.password });
  });

  test('recupera con documento si la respuesta RSC queda pendiente', async ({ page }) => {
    let pendingRscRequests = 0;
    let unblockRsc = () => {};
    const rscGate = new Promise<void>((resolve) => {
      unblockRsc = resolve;
    });

    await page.route('**/settings**', async (route) => {
      const request = route.request();
      const isSettingsRsc =
        request.resourceType() === 'fetch' &&
        request.headers().rsc === '1' &&
        new URL(request.url()).pathname === '/settings';

      if (!isSettingsRsc) {
        await route.continue();
        return;
      }

      pendingRscRequests += 1;
      // Inyecta la espera en el RSC, no en el recorrido. Se libera al observar la request de
      // documento, así la recuperación no compite con una respuesta RSC que llega tarde.
      await rscGate;
      await route.abort().catch(() => {});
    });

    const documentRequest = page.waitForRequest(
      (request) =>
        request.resourceType() === 'document' && new URL(request.url()).pathname === '/settings',
      { timeout: 15_000 },
    );

    try {
      await Promise.all([documentRequest, page.getByRole('link', { name: /^ajustes$/i }).click()]);
      await expect.poll(() => pendingRscRequests).toBe(1);
      unblockRsc();
      await expect(page).toHaveURL(/\/settings$/, { timeout: 30_000 });
      // Llegar al heading autenticado después del documento prueba que la sesión sobrevivió.
      await expect(page.getByRole('heading', { name: /^ajustes$/i, level: 1 })).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      unblockRsc();
      await page.unrouteAll({ behavior: 'wait' });
    }
  });
});
