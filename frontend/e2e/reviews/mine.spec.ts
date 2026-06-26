import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-048 PR-B: tab Mías shows the reviews the authenticated student published.
 *
 * Setup pattern mirrors the PR-A spec (`pending.spec.ts`):
 *  1. Sign Lucía in.
 *  2. Make sure she has at least one review: if `GET /api/reviews/me` is empty we go
 *     through the publish flow to create one (walk the seeded commission offerings because
 *     the dev DB has UNIQUE(student, subject, term) and accumulates state across runs).
 *  3. Navigate to /reviews?tab=mine and assert the chip + stats render.
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

test.describe('Reseñas · tab Mías (US-048)', () => {
  test.setTimeout(120_000);

  test('renderea la lista con stats + chip de status', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Ensure at least one review exists. If Lucía already has reviews from previous runs
    // we reuse them; otherwise we publish a fresh one by walking through the editor flow.
    const existing = await page.request.get('/api/reviews/me');
    expect(existing.ok(), `failed to fetch my reviews: ${existing.status()}`).toBe(true);
    const existingBody = (await existing.json()) as { items: unknown[] };

    if (existingBody.items.length === 0) {
      // Need to seed an enrollment + publish through the editor so the review row exists.
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

      await page.goto(`/reviews/write/${enrollmentId}`);
      await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
        timeout: 30_000,
      });
      // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
      // check() es idempotente, así que sirve igual.
      await page.locator('input[name="docente-picker"]').first().check();
      await page.locator('label:has(input[name="field-rating-radio"][value="5"])').click();
      await page.locator('label:has(input[name="field-difficulty-radio"][value="2"])').click();
      await page
        .getByPlaceholder(/¿cómo era la dinámica/i)
        .fill('E2E seed para tab Mías: experiencia general, dificultad baja, recomiendo.');
      await page.getByRole('button', { name: /^publicar reseña$/i }).click();
      // Wait for the post-publish redirect to land before navigating to Mías.
      await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });
    }

    await page.goto('/reviews?tab=mine');
    await expect(page.getByRole('heading', { name: /comunidad y aporte/i })).toBeVisible({
      timeout: 15_000,
    });

    // Stats header rendered.
    await expect(page.getByText(/publicadas/i)).toBeVisible();

    // At least one chip (publicada or en revisión, depending on filter outcome).
    const list = page.getByLabel(/tus reseñas publicadas/i);
    await expect(list).toBeVisible();
    const chips = list.locator('span:has-text("publicada"), span:has-text("en revisión")');
    await expect(chips.first()).toBeVisible();
  });
});
