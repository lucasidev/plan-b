import { expect, test } from '@playwright/test';
import { LUCIA, MATEO } from '../helpers/personas';

/**
 * E2E for US-019: report a review.
 *
 * The reporter must not be the author (backend returns 403 otherwise), and the public feed
 * is anonymous so the UI cannot pre-filter. So we use two personas: Lucía authors a review
 * with unique text, then Mateo (a different member) finds that card in the Explorar feed
 * and reports it. Asserts the success confirmation.
 */

const SUBJECTS = [
  '00000004-0000-4000-a000-000000000001',
  '00000004-0000-4000-a000-000000000002',
  '00000004-0000-4000-a000-000000000003',
  '00000004-0000-4000-a000-000000000004',
  '00000004-0000-4000-a000-000000000005',
  '00000004-0000-4000-a000-000000000006',
  '00000004-0000-4000-a000-000000000007',
  '00000004-0000-4000-a000-000000000008',
  '00000004-0000-4000-a000-000000000009',
  '00000004-0000-4000-a000-00000000000a',
  '00000004-0000-4000-a000-00000000000b',
  '00000004-0000-4000-a000-00000000000c',
  '00000004-0000-4000-a000-00000000000d',
  '00000004-0000-4000-a000-00000000000e',
  '00000004-0000-4000-a000-00000000000f',
];

const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

/**
 * Sign in and wait to leave /sign-in. Does NOT assert a specific landing page: a member
 * with a profile lands on /home, one without (Mateo on a clean DB) is bounced to
 * /onboarding. Callers that need the member shell create a profile via API afterwards.
 */
async function signIn(page: import('@playwright/test').Page, persona: typeof LUCIA) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

test.describe('Reseñas · reportar (US-019)', () => {
  test.setTimeout(120_000);

  test('un alumno reporta la reseña de otro y ve la confirmación', async ({ page, context }) => {
    await context.clearCookies();

    // 1) Lucía authors a fresh review with unique text so it sits at the top of Explorar.
    await signIn(page, LUCIA);

    let enrollmentId: string | undefined;
    for (const subjectId of SUBJECTS) {
      for (const termId of TERMS) {
        const resp = await page.request.post('/api/me/enrollment-records', {
          data: {
            subjectId,
            commissionId: crypto.randomUUID(),
            termId,
            status: 'Aprobada',
            approvalMethod: 'Final',
            grade: 7,
          },
        });
        if (resp.ok()) {
          enrollmentId = ((await resp.json()) as { id: string }).id;
          break;
        }
      }
      if (enrollmentId) break;
    }
    expect(enrollmentId, 'no free (subject, term) pair to seed enrollment').toBeDefined();

    const tag = Math.random().toString(36).slice(2, 8);
    const reviewText = `Reseña a reportar e2e ${tag}, contenido limpio y suficientemente largo para publicar.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
    await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
    await page.getByPlaceholder(/¿cómo era la dinámica/i).fill(reviewText);
    await page.getByRole('button', { name: /^publicar reseña$/i }).click();
    await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });

    // 2) Switch to Mateo (different member). He needs a student profile to clear the
    //    onboarding gate that guards the member shell; reporting itself needs no profile,
    //    only authentication. Tolerate 409 if a previous run already created it.
    await context.clearCookies();
    await signIn(page, MATEO);
    await page.request.post('/api/me/student-profiles', {
      data: { careerPlanId: '00000003-0000-4000-a000-000000000003', enrollmentYear: 2024 },
    });

    // 3) Find Lucía's review in the Explorar feed and report it.
    await page.goto('/reviews?tab=explore');
    const list = page.getByLabel(/reseñas de la comunidad/i);
    const card = list.locator('li', { hasText: reviewText });
    await expect(card).toBeVisible({ timeout: 15_000 });

    await card.getByRole('button', { name: /reportar/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: /datos personales/i }).click();
    await dialog.getByRole('button', { name: /enviar reporte/i }).click();

    // 4) Success confirmation.
    await expect(dialog.getByText(/gracias por avisar/i)).toBeVisible({ timeout: 15_000 });
  });
});
