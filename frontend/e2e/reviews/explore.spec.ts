import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E for US-048 PR-C: tab Explorar shows the public feed of Published reviews.
 *
 * The endpoint itself is public (AllowAnonymous), but the `/reviews` shell lives in
 * `(member)` so the page requires authentication. We sign Lucía in to enter the shell,
 * then navigate to ?tab=explore.
 *
 * Seed pattern mirrors the PR-B spec: if there is no Published review yet (CI runs
 * against a clean DB), we publish one through the editor flow so the feed has at least
 * one item to render. We rotate (subject, term) pairs because UNIQUE(student, subject,
 * term) collides across runs in the dev DB.
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

test.describe('Reseñas · tab Explorar (US-048)', () => {
  test.setTimeout(120_000);

  test('lista las reseñas públicas y permite filtrar por dificultad', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Make sure there's at least one Published review the feed can show. We use the
    // public endpoint directly (no auth needed) to check.
    const existing = await page.request.get('/api/reviews?pageSize=1');
    expect(existing.ok(), `failed to fetch public feed: ${existing.status()}`).toBe(true);
    const existingBody = (await existing.json()) as { items: unknown[] };

    if (existingBody.items.length === 0) {
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

      await page.goto(`/reviews/write/${enrollmentId}`);
      await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
        timeout: 30_000,
      });
      await page.locator('label:has(input[name="field-rating-radio"][value="5"])').click();
      await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
      await page
        .getByPlaceholder(/¿cómo era la dinámica/i)
        .fill('E2E seed para tab Explorar: contenido honesto y razonable para el público.');
      await page.getByRole('button', { name: /^publicar reseña$/i }).click();
      await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });
    }

    await page.goto('/reviews?tab=explore');
    await expect(page.getByRole('heading', { name: /comunidad y aporte/i })).toBeVisible({
      timeout: 15_000,
    });

    // Filter sidebar rendered with the "Todas" entry active by default.
    const allLink = page.getByRole('link', { name: /^todas$/i });
    await expect(allLink).toHaveAttribute('aria-pressed', 'true');

    // Feed has at least one card.
    const list = page.getByLabel(/reseñas de la comunidad/i);
    await expect(list).toBeVisible();
    await expect(list.locator('article').first()).toBeVisible();

    // Clicking a difficulty filter changes the URL + marks the link as active.
    await page.getByRole('link', { name: /3 · justa/i }).click();
    await expect(page).toHaveURL(/[?&]difficulty=3/);
    const activeFilter = page.getByRole('link', { name: /3 · justa/i });
    await expect(activeFilter).toHaveAttribute('aria-pressed', 'true');
  });
});
