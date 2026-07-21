import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-048: tab Mías shows the reviews the authenticated student published.
 *
 * Cada corrida crea su propio alumno descartable (`createStudent`, ver
 * `e2e/helpers/students.ts`) y publica una reseña sobre una cursada propia: al ser un alumno
 * nuevo, `GET /api/reviews/me` arranca siempre vacío, así que no hace falta el chequeo "ya
 * tiene alguna" que hacía falta cuando la persona era compartida (LUCIA). Después navega a
 * /reviews?tab=mine y verifica que el chip + las stats rendericen.
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A" (brandt, sosa)

test.describe('Reseñas · tab Mías (US-048)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('renderea la lista con stats + chip de status', async ({ page, context, request }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-mine' });

    await context.clearCookies();
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
        status: 'Passed',
        approvalMethod: 'FinalExam',
        grade: 7,
      },
    });
    expect(enrollResp.ok(), `failed to seed enrollment: ${enrollResp.status()}`).toBe(true);
    const enrollmentId = ((await enrollResp.json()) as { id: string }).id;

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
