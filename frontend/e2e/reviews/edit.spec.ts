import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-018: edit own review.
 *
 * Same setup pattern as <c>mine.spec.ts</c>: log Lucía in, make sure she has a Published
 * review (publish one through the editor if not), click Edit in the Mías tab, modify the
 * text, save, and assert the new text shows up in the Mías card.
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

    // Use a short non-digit suffix: long digit sequences (Date.now is 13 digits) match the
    // backend's PII phone regex and push the review to UnderReview, which would 409 the
    // subsequent edit. Letters keep the text long enough but invisible to the PII filter.
    const tag = Math.random().toString(36).slice(2, 8);
    const originalText = `Texto original e2e edit ${tag}, queda con margen para superar el minimo de cincuenta caracteres limpios.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
    // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
    // check() es idempotente, así que sirve igual.
    await page.locator('input[name="docente-picker"]').first().check();
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
    const reviewId = seeded?.id ?? '';

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
