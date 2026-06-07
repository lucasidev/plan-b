import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-018: edit own review.
 *
 * Same setup pattern as <c>mine.spec.ts</c>: log Lucía in, make sure she has a Published
 * review (publish one through the editor if not), click Edit in the Mías tab, modify the
 * text, save, and assert the new text shows up in the Mías card.
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

test.describe('Reseñas · editar (US-018)', () => {
  test.setTimeout(120_000);

  test('editar una reseña publicada y ver el texto actualizado en Mías', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Always seed a fresh enrollment + review so the test owns the row it edits. Going
    // through previously-created reviews is brittle: prior runs of the cooldown / filter
    // specs can leave the first "Editar" link pointing at a non-editable row.
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

    // Use a short non-digit suffix: long digit sequences (Date.now is 13 digits) match the
    // backend's PII phone regex and push the review to UnderReview, which would 409 the
    // subsequent edit. Letters keep the text long enough but invisible to the PII filter.
    const tag = Math.random().toString(36).slice(2, 8);
    const originalText = `Texto original e2e edit ${tag}, queda con margen para superar el minimo de cincuenta caracteres limpios.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
    await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
    await page.getByPlaceholder(/¿cómo era la dinámica/i).fill(originalText);
    await page.getByRole('button', { name: /^publicar reseña$/i }).click();
    await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });

    // Find the review id we just created via the listing.
    const mineResp = await page.request.get('/api/reviews/me');
    const mineBody = (await mineResp.json()) as {
      items: { id: string; enrollmentId: string }[];
    };
    const seeded = mineBody.items.find((r) => r.enrollmentId === enrollmentId);
    expect(seeded, 'just-published review not found in /api/reviews/me').toBeDefined();
    const reviewId = seeded!.id;

    // Navigate directly to the edit page for that review.
    await page.goto(`/reviews/edit/${reviewId}`);
    await expect(page.getByRole('heading', { name: /editá tu reseña/i })).toBeVisible({
      timeout: 15_000,
    });

    const editTag = Math.random().toString(36).slice(2, 8);
    const editedText = `Texto editado por el E2E ${editTag}, sigue cumpliendo el minimo de cincuenta caracteres limpios.`;
    const textarea = page.getByPlaceholder(/¿cómo era la dinámica/i);
    await textarea.fill(editedText);

    await page.getByRole('button', { name: /^guardar cambios$/i }).click();
    await expect(page).toHaveURL(/\/reviews\?tab=mine$/, { timeout: 30_000 });

    const list = page.getByLabel(/tus reseñas publicadas/i);
    await expect(list.getByText(editedText)).toBeVisible({ timeout: 15_000 });
  });
});
