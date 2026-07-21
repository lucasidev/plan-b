import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-018: edit own review.
 *
 * Cada corrida crea su propio alumno descartable (`createStudent`, ver
 * `e2e/helpers/students.ts`) en lugar de compartir la persona LUCIA: publica una reseña sobre
 * una cursada propia, la edita desde el tab Mías, y verifica que el texto nuevo aparezca en la
 * card. Con un alumno nuevo por corrida el UNIQUE(student_profile_id, subject_id, term_id) de
 * enrollment_records nunca colisiona, así que alcanza con una sola oferta sembrada (sin rotar
 * entre comisiones ni depender de que alguna esté libre).
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A" (brandt, sosa)

test.describe('Reseñas · editar (US-018)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('editar una reseña publicada y ver el texto actualizado en Mías', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-edit' });

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
        status: 'Aprobada',
        approvalMethod: 'Final',
        grade: 7,
      },
    });
    expect(enrollResp.ok(), `failed to seed enrollment: ${enrollResp.status()}`).toBe(true);
    const enrollmentId = ((await enrollResp.json()) as { id: string }).id;

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
