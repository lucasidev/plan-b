import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';
import {
  clearAllMessages,
  extractTokenFromLatestMail,
  waitForMail,
} from '../helpers/mailpit';
import { clearForgotPasswordRateLimits } from '../helpers/redis';

/**
 * E2E happy path + edge cases del flow forgot/reset password (US-033).
 *
 * Migrado del throwaway que escribí durante US-033 contra el frontend en
 * vivo (Playwright headless smoke). Cubre lo que en su momento validamos
 * a mano + dejé en `docs/domain/user-stories/US-033-i.md` AC matrix:
 *
 *   - sign-in → click forgot link → /forgot-password
 *   - submit email → /forgot-password/check-inbox?email=...
 *   - extract token de mailpit → /reset-password?token=...
 *   - errors in-field: password corta, mismatch
 *   - happy path → /auth?reset=success con banner
 *   - sign-in con la nueva pw → /home
 *   - garbage token → CTA "Pedí un link nuevo"
 *   - sin token → fallback "Falta el link"
 *
 * Cada test deja a Lucía con su pw original al final (helper
 * `restoreLuciaPassword()`). El test runner los ejecuta serial por default,
 * pero el restore es defensivo: si un test crashea sin restaurar, el siguiente
 * arranca con pw rota. Tradeoff aceptado para mantener la suite simple.
 */

const TEMP_PASSWORD = 'temp-pw-for-e2e-12';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

async function restoreLuciaPassword() {
  // Vía backend directo: forgot-password + reset-password con el token del mail.
  // Reusa los helpers en lugar de repetir lógica.
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
    await page.waitForURL(/\/forgot-password$/);

    // 2. submit email → /forgot-password/check-inbox?email=...
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByRole('button', { name: /mandame el link/i }).click();
    await page.waitForURL(/\/forgot-password\/check-inbox/);
    expect(new URL(page.url()).searchParams.get('email')).toBe(LUCIA.email);

    // 3. extract token de mailpit → /reset-password?token=...
    const token = await extractTokenFromLatestMail(LUCIA.email);
    await page.goto(`/reset-password?token=${token}`);
    await expect(page.getByLabel(/^contraseña nueva$/i)).toBeVisible();

    // 4. errors in-field: password corta
    await page.getByLabel(/^contraseña nueva$/i).fill('short1');
    await page.getByLabel(/repetí la contraseña/i).fill('short1');
    await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();
    await expect(page.getByText(/al menos 12 caracteres/i)).toBeVisible();

    // 5. errors in-field: mismatch
    await page.getByLabel(/^contraseña nueva$/i).fill(TEMP_PASSWORD);
    await page.getByLabel(/repetí la contraseña/i).fill(`${TEMP_PASSWORD}WRONG`);
    await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();
    await expect(page.getByText(/no coinciden/i)).toBeVisible();

    // 6. happy path → /auth?reset=success
    await page.getByLabel(/^contraseña nueva$/i).fill(TEMP_PASSWORD);
    await page.getByLabel(/repetí la contraseña/i).fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: /guardar contraseña nueva/i }).click();
    await page.waitForURL(/\/auth\?reset=success/);
    await expect(page.getByRole('status')).toContainText(/listo/i);

    // 7. sign-in con la nueva pw → /home
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 10_000 });

    // 8. cleanup: restaurar pw original
    await restoreLuciaPassword();
  });

  test('email random no existente → 204 sin mail (anti-enumeración)', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/tu email/i).fill('no-existe@nope.com');
    await page.getByRole('button', { name: /mandame el link/i }).click();
    await page.waitForURL(/\/forgot-password\/check-inbox/);

    // No debería haber mail. Esperamos un poco para asegurar que el backend
    // tuvo chance de enviar (no debería) y verificamos que el inbox sigue vacío.
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
