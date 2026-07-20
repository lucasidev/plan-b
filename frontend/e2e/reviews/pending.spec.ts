import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-048 PR-A: the tab Pendientes is wired end-to-end against the real backend.
 *
 * Cada corrida crea su propio alumno descartable (`createStudent`, ver
 * `e2e/helpers/students.ts`) y le siembra un enrollment terminal fresco: al ser un alumno
 * nuevo no hay pendientes previos que reusar (a diferencia de cuando la persona compartida era
 * LUCIA), así que el test arranca directo desde el editor.
 *
 * Mocking note: the backend rework for the editor v2 fields (rating, hoursPerWeek, tags,
 * recommendations) is pending. Today the publish action lossy-maps the editor draft onto
 * the US-017 payload (difficulty + text + grade). The test only asserts the e2e flow
 * (cursada disappears from pending), not the persistence of the lossy fields.
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000004'; // PRG101
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // Cid01 (brandt, sosa)

test.describe('Reseñas · tab Pendientes (US-048)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('flow pendiente → editor → publicar → cursada desaparece', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-pending' });

    await context.clearCookies();

    // Sign in.
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    const enrollResp = await page.request.post('/api/me/enrollment-records', {
      data: {
        subjectId: SUBJECT_ID,
        commissionId: COMMISSION_ID,
        termId: TERM_ID,
        status: 'Aprobada',
        approvalMethod: 'Final',
        grade: 7,
      },
    });
    expect(enrollResp.ok(), `failed to seed enrollment: ${enrollResp.status()}`).toBe(true);
    const enrollmentId = ((await enrollResp.json()) as { id: string }).id;

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
