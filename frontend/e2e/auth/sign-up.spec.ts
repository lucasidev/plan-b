import { expect, type Page, test } from '@playwright/test';
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
 * Desde ADR-0086 el registro pide también la carrera (`<CareerPicker>` entre los campos de
 * cuenta y el CTA), así que el registro por UI ahora completa esa cascada antes de submitear.
 *
 * Errores in-form (password corta, email inválido) se cubren a nivel
 * vitest en `features/sign-up/components/sign-up-form.test.tsx`. Acá nos
 * concentramos en el flow cross-stack (DB + mail + redirects).
 */

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@planb.local`;
}

/**
 * Completa la cascada Universidad → Carrera → Plan del `<CareerPicker>` que vive en
 * `/sign-up`. Cada nivel espera a que el `<select>` de abajo se habilite:
 * la carrera se pide recién con la universidad elegida, y el plan con la carrera.
 */
async function fillCareerCascade(page: Page): Promise<void> {
  await page.getByLabel(/^universidad$/i).waitFor();
  await page
    .getByLabel(/^universidad$/i)
    .selectOption({ label: 'Universidad del Norte Santo Tomás de Aquino' });

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page
    .getByLabel(/^carrera$/i)
    .selectOption({ label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software' });

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerPlanId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page.getByLabel(/plan de estudios/i).selectOption({ index: 1 });
}

test.describe('sign-up + verify + first sign-in chain (US-010 + US-011 + US-028)', () => {
  // Solo el primer test crea un user nuevo; los otros dos no llegan a registrar nada (email
  // ya en el seed / token inválido), así que quedan en null y el cleanup skippea para ellos.
  let createdStudent: { email: string; password: string } | null = null;

  test.afterEach(async ({ request }) => {
    if (!createdStudent) return;
    await deleteStudent(request, createdStudent);
    createdStudent = null;
  });

  test('alumno nuevo se registra, verifica el mail y aterriza en /home', async ({ page }) => {
    const email = uniqueEmail('e2e-signup');
    const password = 'e2e-test-pw-1234';
    createdStudent = { email, password };

    // 1. /sign-up → form de registro visible
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /empezá en 30 segundos/i })).toBeVisible();

    // 2. Submit con email + password + confirm + la cascada de carrera
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repetí la contraseña/i).fill(password);
    await fillCareerCascade(page);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();

    // 3. Backend devuelve 202 (igual exista o no la cuenta, ADR-0076) → redirect a /sign-up/check-inbox?email=
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

    // 7. Login con la cuenta recién creada, que aterriza directo en /home: la
    //    carrera se declaró en el alta y el StudentProfile ya nació al verificar
    //    el mail, así que no hay pantalla intermedia que completar. Es la
    //    garantía US-170 verificada de punta a punta.
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  });

  test('email duplicado en sign-up responde igual que uno libre (ADR-0076)', async ({ page }) => {
    // Reusamos LUCIA: su email ya existe en el seed. La pantalla NO puede decirlo:
    // confirmar que un mail tiene cuenta es confirmar que esa persona aportó. El
    // backend responde 202 igual que con un mail libre y la diferencia viaja por
    // el mail privado ("Ya tenés una cuenta").
    await page.goto('/sign-up');
    await page.getByLabel(/tu email/i).fill('lucia.mansilla@gmail.com');
    await page.getByLabel(/^contraseña$/i).fill('any-valid-pw-123');
    await page.getByLabel(/repetí la contraseña/i).fill('any-valid-pw-123');
    await fillCareerCascade(page);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();

    await expect(page).toHaveURL(/\/sign-up\/check-inbox/, { timeout: 15_000 });
    await expect(page.getByText(/ya existe una cuenta con ese email/i)).not.toBeVisible();
  });

  test('verify-email con token inválido muestra mensaje de error + CTA registrarme', async ({
    page,
  }) => {
    await page.goto('/verify-email?token=garbage-token-not-valid');
    await expect(page.getByRole('heading', { name: /no es válido/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /registrarme de nuevo/i })).toBeVisible();
  });
});
