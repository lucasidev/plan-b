import { expect, test } from '@playwright/test';
import { clearAllMessages, extractTokenFromLatestMail } from '../helpers/mailpit';
import { LUCIA } from '../helpers/personas';
import { clearForgotPasswordRateLimits } from '../helpers/redis';

/**
 * E2E happy path + edge cases del flow forgot/reset password (US-033).
 *
 * Migrado del throwaway que escribí durante US-033. Cubre lo que en su
 * momento validamos a mano + lo que está en `docs/domain/user-stories/US-033-i.md`.
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
 */

const TEMP_PASSWORD = 'temp-pw-for-e2e-12';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

async function restoreLuciaPassword() {
  await clearForgotPasswordRateLimits();
  await clearAllMessages();

  const r1 = await fetch(`${BACKEND_URL}/api/identity/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LUCIA.email }),
  });
  if (r1.status !== 204) throw new Error(`forgot-password restore failed: ${r1.status}`);

  const token = await extractTokenFromLatestMail(LUCIA.email);
  const r2 = await fetch(`${BACKEND_URL}/api/identity/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword: LUCIA.password }),
  });
  if (r2.status !== 204) throw new Error(`reset-password restore failed: ${r2.status}`);
}

test.describe('forgot/reset password (US-033)', () => {
  test.beforeEach(async () => {
    await clearForgotPasswordRateLimits();
    await clearAllMessages();
  });

  test('Lucía recupera su contraseña desde sign-in y vuelve a entrar', async ({ page }) => {
    // 1. /auth → click forgot link → /forgot-password
    await page.goto('/auth');
    await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/, { timeout: 15_000 });

    // 2. submit email → /forgot-password/check-inbox?email=...
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByRole('button', { name: /mandame el link/i }).click();
    await expect(page).toHaveURL(/\/forgot-password\/check-inbox/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('email')).toBe(LUCIA.email);

    // 3. extract token de mailpit → /reset-password?token=...
    const token = await extractTokenFromLatestMail(LUCIA.email);
    await page.goto(`/reset-password?token=${token}`);
    await expect(page.getByLabel(/^contraseña nueva$/i)).toBeVisible();

    // 4. Happy path → /auth?reset=success.
    // (Inline validation errors – password corta, mismatch – se cubren
    // en el component test del reset-password-form, no acá. Acá nos
    // concentramos en el flow cross-stack.)
    await page.getByLabel(/^contraseña nueva$/i).fill(TEMP_PASSWORD);
    await page.getByLabel(/repetí la contraseña/i).fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();
    await expect(page).toHaveURL(/\/auth\?reset=success/, { timeout: 15_000 });
    await expect(page.getByRole('status').filter({ hasText: /listo/i })).toBeVisible();

    // 5. Sign-in con la nueva pw → /home
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // 6. Cleanup: restaurar pw original
    await restoreLuciaPassword();
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
