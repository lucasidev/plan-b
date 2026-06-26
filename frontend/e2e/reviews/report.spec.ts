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

// Comisiones sembradas (US-065): solo estas combinaciones (materia, term, comisión) tienen una
// comisión real con docentes, condición para que la cursada sea reseñable (docente real por reseña).
// Probamos cada una hasta que un POST entre: la dev DB comparte estado entre runs y
// EnrollmentRecords tiene UNIQUE(student, subject, term), así que estas nueve dan headroom.
const COMMISSION_OFFERINGS = [
  {
    subjectId: '00000004-0000-4000-a000-000000000004', // PRG101
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000001', // Cid01 (brandt, sosa)
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000001', // MAT102
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000003', // Cid03 (iturralde)
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000020', // ISW301
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000006', // Cid06 (ledesma, brandt)
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000010', // PRG201
    termId: '00000005-0000-4000-a000-000000000004', // 2025·2c
    commissionId: '00000007-0000-4000-a000-000000000004', // Cid04 (castro, castellanos)
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000013', // BD201
    termId: '00000005-0000-4000-a000-000000000004', // 2025·2c
    commissionId: '00000007-0000-4000-a000-000000000005', // Cid05 (méndez, páez)
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000002', // ALG101
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000007', // Cid07
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000003', // INT101
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000008', // Cid08
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000014', // SO201
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-000000000009', // Cid09
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000011', // MAT201
    termId: '00000005-0000-4000-a000-000000000005', // 2026·1c
    commissionId: '00000007-0000-4000-a000-00000000000a', // Cid0a
  },
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
    for (const offering of COMMISSION_OFFERINGS) {
      const resp = await page.request.post('/api/me/enrollment-records', {
        data: {
          subjectId: offering.subjectId,
          commissionId: offering.commissionId,
          termId: offering.termId,
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
    expect(
      enrollmentId,
      'could not seed an enrollment: every seeded commission offering already used',
    ).toBeDefined();

    const tag = Math.random().toString(36).slice(2, 8);
    const reviewText = `Reseña a reportar e2e ${tag}, contenido limpio y suficientemente largo para publicar.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
    // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
    // check() es idempotente, así que sirve igual.
    await page.locator('input[name="docente-picker"]').first().check();
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
