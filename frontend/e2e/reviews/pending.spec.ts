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

// Seeded subjects on the TUDCS plan. We rotate over them per run so the spec stays robust
// against pre-existing pending rows in the shared dev DB.
const SUBJECTS = [
  '00000004-0000-4000-a000-000000000005',
  '00000004-0000-4000-a000-000000000006',
  '00000004-0000-4000-a000-000000000007',
  '00000004-0000-4000-a000-000000000008',
  '00000004-0000-4000-a000-000000000009',
];

const TERMS = [
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
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
    // from a previous run or hand-loaded transcript). Otherwise create a fresh enrollment.
    // The dev DB is shared across runs and `EnrollmentRecords` has a UNIQUE
    // `(student, subject, term)`, so blindly creating a new row per run drifts state until
    // the suite breaks. Reusing the first pending stays robust without cleanup.
    let enrollmentId: string;
    const existing = await page.request.get('/api/reviews/me/pending');
    expect(existing.ok(), `failed to fetch existing pending: ${existing.status()}`).toBe(true);
    const existingBody = (await existing.json()) as { items: { enrollmentId: string }[] };
    if (existingBody.items.length > 0) {
      enrollmentId = existingBody.items[0].enrollmentId;
    } else {
      const subjectId = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
      const termId = TERMS[Math.floor(Math.random() * TERMS.length)];
      const enrollmentResp = await page.request.post('/api/me/enrollment-records', {
        data: {
          subjectId,
          commissionId: crypto.randomUUID(),
          termId,
          status: 'Aprobada',
          approvalMethod: 'Final',
          grade: 7,
        },
      });
      expect(enrollmentResp.ok(), `failed to seed enrollment: ${enrollmentResp.status()}`).toBe(
        true,
      );
      const created = (await enrollmentResp.json()) as { id: string };
      enrollmentId = created.id;
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
