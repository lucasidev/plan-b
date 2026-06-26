import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-055: delete own review.
 *
 * Seeds a fresh enrollment + review so the test owns the row it deletes, then opens the
 * delete modal from the Mías card, confirms, and asserts the review drops from the list.
 * Same commission-offering rotation as the sibling specs to avoid UNIQUE collisions across
 * runs in the dev DB.
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

test.describe('Reseñas · borrar (US-055)', () => {
  test.setTimeout(120_000);

  test('borrar una reseña propia la saca del listado de Mías', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Seed a fresh enrollment + review so the test owns the row it deletes.
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
    const reviewText = `Reseña a borrar e2e ${tag}, contenido limpio con largo suficiente para publicar.`;
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

    // Go to Mías; the just-published review is there.
    await page.goto('/reviews?tab=mine');
    const list = page.getByLabel(/tus reseñas publicadas/i);
    await expect(list.getByText(reviewText)).toBeVisible({ timeout: 15_000 });

    // Open the delete modal from that review's row and confirm.
    // The review's card is the <li> containing its text; scope the Borrar button to it.
    const card = list.locator('li', { hasText: reviewText });
    await card.getByRole('button', { name: /^borrar$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/acción permanente/i)).toBeVisible();
    await dialog.getByRole('button', { name: /^borrar reseña$/i }).click();

    // Success path: the modal closes first (proves the delete resolved), then the card's
    // <li> detaches once the list refetches. We assert the specific card, not any text in
    // the list, because the modal preview also contains the review text (the <dialog> lives
    // inside the <li>) and would double-count mid-transition.
    await expect(dialog).toHaveCount(0, { timeout: 20_000 });
    await expect(card).toHaveCount(0, { timeout: 15_000 });
  });
});
