import { expect, test } from '@playwright/test';
import { extractTokenFromLatestMail } from '../helpers/mailpit';

/**
 * E2E happy chain de sign-up + verify + first sign-in (US-010 + US-011 + US-028).
 *
 * Cubre el flujo completo del alumno nuevo desde registrarse hasta entrar
 * a /home por primera vez, que es la pieza más visible para el evaluador.
 *
 * El flujo no usa personas pre-seedeadas: cada test crea un email único
 * con timestamp para evitar choques con runs anteriores y con la DB
 * compartida. No restauramos al final porque el user queda como verified
 * orphan; el cleanup natural llega vía US-022 (expirar no verificados)
 * para usuarios que NUNCA verificaron, que no es este caso.
 *
 * Errores in-form (password corta, email inválido) se cubren a nivel
 * vitest en `features/sign-up/components/sign-up-form.test.tsx`. Acá nos
 * concentramos en el flow cross-stack (DB + mail + redirects).
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@planb.local`;
}

async function disableUserByEmail(email: string): Promise<void> {
  // Cleanup defensivo: si una corrida anterior dejó este email, lo
  // ignoramos. La DB del dev stack no se resetea entre tests; usamos
  // emails únicos para evitar la colisión, pero si por alguna razón
  // un test reuso el mismo email, esto no rompe.
  try {
    await fetch(`${BACKEND_URL}/api/identity/users/by-email/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  } catch {
    // Endpoint puede no existir; ignorar.
  }
}

test.describe('sign-up + verify + first sign-in chain (US-010 + US-011 + US-028)', () => {
  test('alumno nuevo se registra, verifica el mail y entra a /home', async ({ page }) => {
    const email = uniqueEmail('e2e-signup');
    const password = 'e2e-test-pw-1234';

    // 1. /auth?mode=signup → form de registro visible
    await page.goto('/auth?mode=signup');
    await expect(page.getByRole('tab', { name: /crear cuenta/i, selected: true })).toBeVisible();

    // 2. Submit con email + password + confirm
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repetí la contraseña/i).fill(password);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();

    // 3. Backend devuelve 201 → redirect a /auth/check-inbox?email=
    await expect(page).toHaveURL(/\/auth\/check-inbox/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('email')).toBe(email);

    // 4. Mailpit recibió el mail con el token de verify
    const token = await extractTokenFromLatestMail(email);
    expect(token).toBeTruthy();

    // 5. Click al link → /verify-email?token= → success state
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByRole('heading', { name: /^¡listo!$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();

    // 6. CTA "Iniciar sesión" → /auth en modo signin
    await page.getByRole('link', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/auth(\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole('tab', { name: /^ingresar$/i, selected: true })).toBeVisible();

    // 7. Login con la cuenta recién creada → /home
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });

    // Cleanup defensivo. No rompe si el endpoint de delete no existe.
    await disableUserByEmail(email);
  });

  test('email duplicado en sign-up muestra error in-form', async ({ page }) => {
    // Reusamos LUCIA: su email ya existe en el seed.
    await page.goto('/auth?mode=signup');
    await page.getByLabel(/tu email/i).fill('lucia.mansilla@gmail.com');
    await page.getByLabel(/^contraseña$/i).fill('any-valid-pw-123');
    await page.getByLabel(/repetí la contraseña/i).fill('any-valid-pw-123');
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();

    // 409 → mensaje "ya existe una cuenta con ese email" debajo del campo email
    await expect(page.getByText(/ya existe una cuenta con ese email/i)).toBeVisible();
  });

  test('verify-email con token inválido muestra mensaje de error + CTA registrarme', async ({
    page,
  }) => {
    await page.goto('/verify-email?token=garbage-token-not-valid');
    await expect(page.getByRole('heading', { name: /no es válido/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /registrarme de nuevo/i })).toBeVisible();
  });
});
