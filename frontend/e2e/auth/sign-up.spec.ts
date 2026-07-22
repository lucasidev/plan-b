import { expect, test } from '@playwright/test';
import { extractTokenFromLatestMail } from '../helpers/mailpit';
import { deleteStudent } from '../helpers/students';

/**
 * E2E happy chain de sign-up + verify + first sign-in (US-010 + US-011 + US-028).
 *
 * Cubre el flujo completo del alumno nuevo desde registrarse hasta entrar
 * a /home por primera vez, que es la pieza más visible para el evaluador.
 *
 * El flujo no usa personas pre-seedeadas: cada test crea un email único
 * con timestamp para evitar choques con runs anteriores y con la DB
 * compartida.
 *
 * El registro, la verificación y el primer sign-in quedan por UI (es el flujo bajo prueba). El
 * cleanup reusa `deleteStudent` de `e2e/helpers/students.ts`, que pega a un endpoint real
 * (`DELETE /api/me/account`, self-service, ADR-0044). Antes este spec llamaba a
 * `DELETE /api/identity/users/by-email/:email`, una ruta que nunca existió en el backend (404
 * siempre, verificado); el propio comentario viejo ya dudaba ("endpoint puede no existir,
 * ignorar"). Con eso el user de esta prueba quedaba activo para siempre en cada corrida.
 *
 * Errores in-form (password corta, email inválido) se cubren a nivel
 * vitest en `features/sign-up/components/sign-up-form.test.tsx`. Acá nos
 * concentramos en el flow cross-stack (DB + mail + redirects).
 */

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@planb.local`;
}

test.describe('sign-up + verify + first sign-in chain (US-010 + US-011 + US-028)', () => {
  // Solo el primer test crea un user nuevo; los otros dos no llegan a registrar nada (409 por
  // email duplicado / token inválido), así que quedan en null y el cleanup skippea para ellos.
  let createdStudent: { email: string; password: string } | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdStudent) return;
    await deleteStudent(request, createdStudent);
    createdStudent = null;
  });

  test('alumno nuevo se registra, verifica el mail y aterriza en onboarding', async ({ page }) => {
    const email = uniqueEmail('e2e-signup');
    const password = 'e2e-test-pw-1234';
    createdStudent = { email, password };

    // 1. /sign-up → form de registro visible
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /empezá en 30 segundos/i })).toBeVisible();

    // 2. Submit con email + password + confirm
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repetí la contraseña/i).fill(password);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();

    // 3. Backend devuelve 201 → redirect a /sign-up/check-inbox?email=
    await expect(page).toHaveURL(/\/sign-up\/check-inbox/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('email')).toBe(email);

    // 4. Mailpit recibió el mail con el token de verify
    const token = await extractTokenFromLatestMail(email);
    expect(token).toBeTruthy();

    // 5. Click al link → /verify-email?token= → success state
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByRole('heading', { name: /^¡listo!$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();

    // 6. CTA "Iniciar sesión" → /sign-in
    await page.getByRole('link', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /entrá a tu cuenta/i })).toBeVisible();

    // 7. Login con la cuenta recién creada. Guard de (member) lo manda a
    //    /onboarding/welcome porque el alumno todavía no tiene StudentProfile
    //    (US-037-f). El flow completo de onboarding hasta /home queda
    //    cubierto por `onboarding.spec.ts`; este spec verifica solo el chain
    //    sign-up → verify → sign-in.
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/welcome$/, { timeout: 15_000 });
  });

  test('email duplicado en sign-up muestra error in-form', async ({ page }) => {
    // Reusamos LUCIA: su email ya existe en el seed.
    await page.goto('/sign-up');
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
