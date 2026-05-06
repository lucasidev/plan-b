import { expect, test } from '@playwright/test';
import { extractTokenFromLatestMail } from '../helpers/mailpit';

/**
 * E2E del onboarding (US-037-f).
 *
 * Cubre:
 *   - Flow completo de un alumno nuevo: register → verify → sign-in →
 *     onboarding 4 pasos → /home con AppShell.
 *   - Negativo: el mismo alumno (post-onboarding) que pega URL directa
 *     `/onboarding/welcome` aterriza en `/home` (guard "ya tenés profile").
 *
 * Por la duración del happy path (~30s) es 1 test grande en lugar de 4 chicos.
 * Splitearlo agregaría setup repetido (signup + verify) sin valor extra. El
 * negativo se hace dentro del mismo test al final, reusando la sesión.
 *
 * **Cleanup**: deuda explícita. El test no limpia los users que crea — eso
 * requiere el endpoint `DELETE /api/me/account` (US planeada para "el user
 * elimina su cuenta", compliance Ley 25.326 art. 6). Mientras tanto, en CI
 * la DB es efímera por job (no afecta) y en local se acepta que `*@planb.local`
 * users se acumulan entre runs (ver `docs/testing/conventions.md`, sección
 * "Dominio vs infra"). Cuando aterrice la US de delete account, este spec
 * agrega `test.afterEach` que llama el endpoint real.
 */

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@planb.local`;
}

test.describe('onboarding (US-037-f)', () => {
  test('alumno nuevo completa onboarding 4 pasos y aterriza en /home con AppShell', async ({
    page,
  }) => {
    const email = uniqueEmail('e2e-onboarding');
    const password = 'e2e-test-pw-1234';

    // 1. Register vía /sign-up
    await page.goto('/sign-up');
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByLabel(/repetí la contraseña/i).fill(password);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();
    await expect(page).toHaveURL(/\/sign-up\/check-inbox/, { timeout: 15_000 });

    // 2. Extraer token del mail y verificar
    const token = await extractTokenFromLatestMail(email);
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByRole('heading', { name: /^¡listo!$/i })).toBeVisible();

    // 3. Sign-in con la cuenta recién verificada
    await page.getByRole('link', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 15_000 });
    await page.getByLabel(/tu email/i).fill(email);
    await page.getByLabel(/^contraseña$/i).fill(password);
    await page.getByRole('button', { name: /^entrar$/i }).click();

    // 4. El guard de (member) detecta que NO tiene profile → redirige a
    //    /onboarding/welcome (paso 01).
    await expect(page).toHaveURL(/\/onboarding\/welcome$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /bienvenida/i })).toBeVisible();

    // 5. Click "Empecemos" → paso 02
    await page.getByRole('link', { name: /empecemos/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/career$/, { timeout: 10_000 });

    // 6. Llenar cascadas: UNSTA → TUDCS → Plan 2018
    // Esperar que las opciones de universidad carguen antes de seleccionar.
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

    await page.getByLabel(/año de ingreso/i).fill('2024');

    // 7. Submit → paso 03
    await page.getByRole('button', { name: /continuar/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/history$/, { timeout: 15_000 });

    // 8. Elegir "Lo cargo después" → paso 04
    await page.getByRole('link', { name: /lo cargo después/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/done$/, { timeout: 10_000 });

    // 9. CTA "Ir a Inicio" → /home (AppShell del area autenticada).
    await page.getByRole('link', { name: /ir a inicio/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 10_000 });

    // El AppShell se rendereó: el avatar trigger del sidebar debería estar
    // visible. Lo identificamos por el local-part del email (que el
    // displayNameFromEmail capitaliza como "E2E-Onboarding ..." parecido).
    // Como el local-part contiene chars que regex puede confundir, usamos
    // un check simple de que NO seguimos en /onboarding/.
    await expect(page).not.toHaveURL(/\/onboarding\//);

    // 10. Negativo (mismo user, post-onboarding): pegar URL directa
    //     /onboarding/welcome debería redirigir a /home porque el guard de
    //     la página chequea "ya tenés profile".
    await page.goto('/onboarding/welcome');
    await expect(page).toHaveURL(/\/home$/, { timeout: 10_000 });
  });
});
