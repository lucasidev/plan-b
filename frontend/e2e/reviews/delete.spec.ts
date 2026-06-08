import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-055: delete own review.
 *
 * Seeds a fresh enrollment + review so the test owns the row it deletes, then opens the
 * delete modal from the Mías card, confirms, and asserts the review drops from the list.
 * Same (subject, term) rotation as the sibling specs to avoid UNIQUE collisions across
 * runs in the dev DB.
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
    const reviewText = `Reseña a borrar e2e ${tag}, contenido limpio con largo suficiente para publicar.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
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
