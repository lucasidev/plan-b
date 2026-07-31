import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de US-015: corregir una cursada ya cargada.
 *
 * Recorre el camino destructivo entero, que es el único que ningún nivel más bajo puede ver: el
 * alumno vuelve su cursada a "cursando", la UI le pide confirmación, el backend publica el evento
 * por el outbox, y Reviews pone su reseña en revisión. El test de componente prueba la puerta de
 * confirmación con el action mockeado, y los de integración prueban cada lado del evento por
 * separado; lo que cruza el outbox solo se ve acá.
 *
 * Alumno descartable por corrida (misma razón que los specs de reseñas): `enrollment_records`
 * tiene UNIQUE(student_profile_id, subject_id, term_id), así que un alumno nuevo deja libre la
 * única oferta sembrada sin tener que rotar comisiones.
 */

// Comisión sembrada (US-065): la terna con docente real, condición para que la cursada sea
// reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026-C1
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A"
const TEACHER_ID = '00000006-0000-4000-a000-000000000001'; // brandt

test.describe('Historial · editar una cursada (US-015)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('volver la cursada a "cursando" pide confirmación y manda la reseña a revisión', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-edit-enrollment' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // La cursada aprobada y su reseña se siembran por API: son el punto de partida del flujo bajo
    // prueba, no el flujo.
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

    // Sufijo de letras y no de dígitos: una secuencia larga de números matchea el filtro de PII
    // del backend y la reseña nacería en UnderReview, que es justo el estado que este test tiene
    // que provocar después.
    const tag = Math.random().toString(36).slice(2, 8);
    const reviewResp = await page.request.post('/api/reviews', {
      data: {
        enrollmentId,
        reviewedTeacherId: TEACHER_ID,
        difficultyRating: 3,
        overallRating: 4,
        wouldRecommendCourse: true,
        wouldRetakeTeacher: true,
        subjectText: `Resena e2e de edicion de cursada ${tag}, con largo suficiente para pasar el minimo de cincuenta caracteres.`,
      },
    });
    expect(reviewResp.ok(), `failed to seed review: ${reviewResp.status()}`).toBe(true);

    // ── El flujo bajo prueba arranca acá ──────────────────────────────────────────────────
    await page.goto('/my-career?tab=transcript');
    await page
      .getByRole('link', { name: /^editar /i })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/my-career/transcript/${enrollmentId}/edit$`));
    // El form llega precargado con lo que estaba guardado: eso es lo que hace que editar sea
    // corregir y no volver a cargar todo.
    await expect(page.getByLabel(/^Estado$/)).toHaveValue('Passed', { timeout: 30_000 });
    await expect(page.getByLabel(/Nota final/i)).toHaveValue('7');

    await page.getByLabel(/^Estado$/).selectOption('InProgress');
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    // La confirmación explícita que pide el AC. Sin ella el alumno mandaría su reseña a revisión
    // sin enterarse.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/va a poner tu reseña en revisión/i)).toBeVisible();

    await dialog.getByRole('button', { name: /guardar igual/i }).click();

    await expect(page).toHaveURL(/\/my-career\?tab=transcript/, { timeout: 30_000 });
    await expect(page.getByText('cursando', { exact: true })).toBeVisible();

    // El otro lado del outbox. Es asíncrono por definición (el evento se entrega después del
    // commit), así que se poletea en vez de afirmar de una: el punto es que llegue, no cuándo.
    await expect
      .poll(
        async () => {
          const mine = await page.request.get('/api/reviews/me');
          const body = (await mine.json()) as {
            items: { enrollmentId: string; status: string; underReviewReason: string | null }[];
          };
          const review = body.items.find((r) => r.enrollmentId === enrollmentId);
          return `${review?.status}/${review?.underReviewReason}`;
        },
        { timeout: 30_000, message: 'la reseña nunca pasó a UnderReview por EnrollmentChanged' },
      )
      .toBe('UnderReview/EnrollmentChanged');
  });
});
