import { expect, test } from '@playwright/test';
import { extractTokenFromLatestMail } from '../helpers/mailpit';
import { clearForgotPasswordRateLimits } from '../helpers/redis';
import { createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E happy path + edge cases del flow forgot/reset password (US-033).
 *
 * Migrado del throwaway que escribí durante US-033. Cubre lo que en su
 * momento validamos a mano + lo que está en `docs/history/domain-v1/stories/US-033-i.md`.
 *
 * Diseño:
 * - El happy path se concentra en validar el FLUJO completo (sign-in →
 *   forgot → mail → reset → success → re-signin con la nueva pw). Los
 *   error states inline (validation messages bajo el campo) se cubren
 *   en `frontend/src/features/reset-password/components/*.test.tsx` con
 *   vitest, no acá: el component test es más rápido + más predecible
 *   para esos detalles de DOM.
 * - Los edge cases que SÍ requieren browser (garbage token, sin token,
 *   anti-enum) tienen su propio test cada uno.
 * - El happy path corre contra un alumno descartable (`createStudent`), no contra Lucía: cambiar
 *   la contraseña de una persona sembrada la deja en un estado que otro spec en paralelo puede
 *   pisar a mitad de camino. Un alumno propio se borra entero al final, sin nada que restaurar.
 */

const TEMP_PASSWORD = 'temp-pw-for-e2e-12';

test.describe('forgot/reset password (US-033)', () => {
  test.beforeEach(async () => {
    await clearForgotPasswordRateLimits();
  });

  test('un alumno recupera su contraseña desde sign-in y vuelve a entrar', async ({
    page,
    request,
  }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-forgot-password' });

    try {
      // 1. /sign-in → click forgot link → /forgot-password
      await page.goto('/sign-in');
      await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();
      await expect(page).toHaveURL(/\/forgot-password$/, { timeout: 15_000 });

      // 2. submit email → /forgot-password/check-inbox?email=...
      await page.getByLabel(/tu email/i).fill(student.email);
      await page.getByRole('button', { name: /mandame el link/i }).click();
      await expect(page).toHaveURL(/\/forgot-password\/check-inbox/, { timeout: 15_000 });
      expect(new URL(page.url()).searchParams.get('email')).toBe(student.email);

      // 3. extract token de mailpit → /reset-password?token=...
      const token = await extractTokenFromLatestMail(student.email);
      await page.goto(`/reset-password?token=${token}`);
      await expect(page.getByLabel(/^contraseña nueva$/i)).toBeVisible();

      // 4. Happy path → /sign-in?reset=success.
      // (Errores de validación in-line, password corta, mismatch, se cubren
      // en el component test del reset-password-form, no acá. Acá nos
      // concentramos en el flow cross-stack.)
      await page.getByLabel(/^contraseña nueva$/i).fill(TEMP_PASSWORD);
      await page.getByLabel(/repetí la contraseña/i).fill(TEMP_PASSWORD);
      await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();
      await expect(page).toHaveURL(/\/sign-in\?reset=success/, { timeout: 15_000 });
      await expect(page.getByRole('status').filter({ hasText: /listo/i })).toBeVisible();

      // 5. Sign-in con la nueva pw → /home
      await page.getByLabel(/tu email/i).fill(student.email);
      await page.getByLabel(/^contraseña$/i).fill(TEMP_PASSWORD);
      await page.getByRole('button', { name: /^entrar$/i }).click();
      await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
    } finally {
      // La contraseña ya cambió a TEMP_PASSWORD en el paso 4: es la que hace falta para
      // re-autenticar y borrar la cuenta (self-service, ADR-0044).
      await deleteStudent(request, { email: student.email, password: TEMP_PASSWORD });
    }
  });

  test('email random no existente → 204 sin mail (anti-enumeración)', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/tu email/i).fill('no-existe@nope.com');
    await page.getByRole('button', { name: /mandame el link/i }).click();
    await expect(page).toHaveURL(/\/forgot-password\/check-inbox/, { timeout: 15_000 });

    // Esperamos a que el backend tenga chance de enviar mail (no debería).
    await page.waitForTimeout(800);
    const inbox = await fetch(
      `${process.env.MAILPIT_URL ?? 'http://localhost:8025'}/api/v1/messages?limit=10`,
    ).then((r) => r.json() as Promise<{ messages: Array<{ To: Array<{ Address: string }> }> }>);
    const matchingMails = inbox.messages.filter((m) =>
      m.To.some((t) => t.Address === 'no-existe@nope.com'),
    );
    expect(matchingMails).toHaveLength(0);
  });

  test('garbage token muestra error in-form + CTA "Pedí un link nuevo"', async ({ page }) => {
    await page.goto('/reset-password?token=garbage123notavalid');
    await page.getByLabel(/^contraseña nueva$/i).fill('anyvalid12345');
    await page.getByLabel(/repetí la contraseña/i).fill('anyvalid12345');
    await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();

    await expect(page.getByRole('link', { name: /pedí un link nuevo/i })).toBeVisible();
  });

  test('/reset-password sin token muestra fallback "Falta el link"', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('link', { name: /pedir un link nuevo/i })).toBeVisible();
    // El form de reset NO debería estar visible cuando falta el token.
    await expect(page.getByLabel(/^contraseña nueva$/i)).not.toBeVisible();
  });
});
