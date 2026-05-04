import { expect, test } from '@playwright/test';
import { clearAllMessages, waitForMail } from '../helpers/mailpit';
import { MARTIN } from '../helpers/personas';
import { clearAllIdentityRateLimits } from '../helpers/redis';

/**
 * E2E del flow resend verification (US-021).
 *
 * Cubre el path desde sign-in fallido (cuenta no verificada) → click en
 * el botón "Reenviar el link" → mail llega a Mailpit → cooldown timer
 * visible. Con MARTIN (Unverified) que vive en el seed.
 *
 * El cooldown del backend es 60s (anti-flood, ADR-0023). Para no esperar
 * 60s en el test, validamos solo que el botón muestra el countdown y
 * queda disabled inmediatamente después del click — no que el countdown
 * llegue a 0.
 *
 * Errores in-component (rate-limit, backend down, etc.) están cubiertos
 * a nivel vitest en `features/resend-verification/...`. Acá solo el flow
 * cross-stack.
 */

test.describe('resend verification (US-021)', () => {
  test.beforeEach(async () => {
    await clearAllIdentityRateLimits();
    await clearAllMessages();
  });

  test('Martín pide reenvío del link y el mail llega a su inbox', async ({ page }) => {
    // 1. Sign-in con Martín (no verificado) → error in-form + botón resend
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(MARTIN.email);
    await page.getByLabel(/^contraseña$/i).fill(MARTIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    const resendButton = page.getByRole('button', { name: /reenviar el link/i });
    await expect(resendButton).toBeVisible();

    // 2. Click "Reenviar el link" → backend envía mail nuevo
    await resendButton.click();

    // 3. Mailpit recibe el mail con el token. El subject del backend hoy es
    // "Confirmá tu cuenta en planb"; aceptamos "confirm" o "verific" para
    // tolerar futuros refrasings del template.
    const mail = await waitForMail(MARTIN.email, 5000);
    expect(mail.Subject).toMatch(/confirm|verific/i);
    expect(mail.HTML).toMatch(/[?&]token=/);

    // 4. Botón muestra cooldown ("Reenviar en Ns") y queda disabled
    await expect(page.getByRole('button', { name: /reenviar en \d+s/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reenviar en \d+s/i })).toBeDisabled();
  });
});
