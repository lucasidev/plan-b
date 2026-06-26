import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-048 PR-A: the tab Pendientes is wired end-to-end against the real backend.
 *
 * Setup before each test:
 *  1. Sign Lucía in (she has a seeded StudentProfile for the TUDCS career plan).
 *  2. Create a fresh terminal enrollment via the backend API so the test has a known
 *     pending row to drive through the editor flow. We pick a subject + termId that
 *     varies per run to avoid the UNIQUE(student, subject, term) constraint accumulating
 *     state across runs against the shared dev DB.
 *
 * The test does NOT clean up enrollments at the end. The dev DB tolerates this; each new
 * test run uses a different (subject, term) pair so existing pending rows don't collide.
 *
 * Mocking note: the backend rework for the editor v2 fields (rating, hoursPerWeek, tags,
 * recommendations) is pending. Today the publish action lossy-maps the editor draft onto
 * the US-017 payload (difficulty + text + grade). The test only asserts the e2e flow
 * (cursada disappears from pending), not the persistence of the lossy fields.
 */

// Comisiones sembradas (US-065): solo estas combinaciones (materia, term, comisión) tienen una
// comisión real con docentes, condición para que la cursada sea reseñable (docente real por reseña).
// Probamos cada una hasta que un POST entre: la dev DB comparte estado entre runs y
// EnrollmentRecords tiene UNIQUE(student, subject, term), así que estas nueve dan headroom. Cuando
// aterrice DELETE /api/me/enrollment-records esto se reemplaza por cleanup real.
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

test.describe('Reseñas · tab Pendientes (US-048)', () => {
  test.setTimeout(120_000);

  test('flow pendiente → editor → publicar → cursada desaparece', async ({ page, context }) => {
    await context.clearCookies();

    // Sign in.
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Idempotent seed: pick the first pending review if Lucía already has one (left over
    // from a previous run or hand-loaded transcript). Otherwise try (subject, term) pairs
    // until one succeeds; the dev DB has a UNIQUE(student, subject, term) constraint and
    // earlier runs may already occupy specific pairs.
    let enrollmentId: string | undefined;
    const existing = await page.request.get('/api/reviews/me/pending');
    expect(existing.ok(), `failed to fetch existing pending: ${existing.status()}`).toBe(true);
    const existingBody = (await existing.json()) as { items: { enrollmentId: string }[] };
    if (existingBody.items.length > 0) {
      enrollmentId = existingBody.items[0].enrollmentId;
    } else {
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
          const created = (await resp.json()) as { id: string };
          enrollmentId = created.id;
          break;
        }
      }
      expect(
        enrollmentId,
        'could not seed an enrollment: every seeded commission offering already used',
      ).toBeDefined();
    }

    // Navigate to /reviews?tab=pending.
    await page.goto('/reviews?tab=pending');
    await expect(page.getByRole('heading', { name: /comunidad y aporte/i })).toBeVisible({
      timeout: 15_000,
    });

    // The freshly created enrollment is present. We disambiguate by the link href so we
    // pick the exact row we just created.
    const writeLink = page.locator(`a[href="/reviews/write/${enrollmentId}"]`);
    await expect(writeLink).toBeVisible();
    await writeLink.click();

    // Editor loads.
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });

    // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
    // check() es idempotente, así que sirve igual.
    await page.locator('input[name="docente-picker"]').first().check();

    // Fill the minimum required fields: rating (star 4) and difficulty (step 3). The
    // radio inputs are sr-only; the click goes to the enclosing <label>. The optional
    // text exercises the lossy mapping that ends up in subjectText.
    await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
    await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
    await page
      .getByPlaceholder(/¿cómo era la dinámica/i)
      .fill('Smoke test E2E: cursada cerrada con experiencia general buena.');

    // Publish.
    await page.getByRole('button', { name: /^publicar reseña$/i }).click();

    // Redirected back to /reviews?tab=pending and the cursada no longer appears.
    await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });
    await expect(page.locator(`a[href="/reviews/write/${enrollmentId}"]`)).toHaveCount(0);
  });
});
