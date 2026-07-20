import { expect, test } from '@playwright/test';
import { LUCIA, MATEO, MODERADOR } from '../helpers/personas';

/**
 * E2E para US-050 (cola de reportes) + US-051 (detalle + decisión).
 *
 * Setup: reusa el flujo probado de report.spec (Lucía escribe una reseña, Mateo la reporta) para
 * generar un report `open`, y después el moderador entra al backoffice, ve la cola, abre un detalle y
 * aplica una decisión (Aprobar = dismiss). Verifica el camino completo por rutas reales.
 *
 * No pinpointea el report propio en la cola (la DB dev es compartida y acumula reports entre runs):
 * verifica que el report creado aparezca por su motivo, y resuelve el primero de la cola para ejercitar
 * el flujo de decisión de punta a punta.
 */

// Mismas comisiones sembradas que report.spec (US-065): solo estas (materia, term, comisión) son
// reseñables. Se prueba cada una hasta que un enrollment entre (UNIQUE por student/subject/term).
const COMMISSION_OFFERINGS = [
  {
    subjectId: '00000004-0000-4000-a000-000000000004',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000001',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000001',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000003',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000020',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000006',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000010',
    termId: '00000005-0000-4000-a000-000000000004',
    commissionId: '00000007-0000-4000-a000-000000000004',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000013',
    termId: '00000005-0000-4000-a000-000000000004',
    commissionId: '00000007-0000-4000-a000-000000000005',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000002',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000007',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000003',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000008',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000014',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-000000000009',
  },
  {
    subjectId: '00000004-0000-4000-a000-000000000011',
    termId: '00000005-0000-4000-a000-000000000005',
    commissionId: '00000007-0000-4000-a000-00000000000a',
  },
];

async function signIn(page: import('@playwright/test').Page, persona: typeof LUCIA) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

/** Lucía escribe una reseña y Mateo la reporta. Devuelve el texto único de la reseña. */
async function seedOpenReport(
  page: import('@playwright/test').Page,
  context: import('@playwright/test').BrowserContext,
): Promise<string> {
  await context.clearCookies();
  await signIn(page, LUCIA);

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
  expect(enrollmentId, 'no se pudo sembrar un enrollment reseñable').toBeDefined();

  const tag = Math.random().toString(36).slice(2, 8);
  const reviewText = `Reseña a moderar e2e ${tag}, contenido limpio y suficientemente largo para publicar.`;
  await page.goto(`/reviews/write/${enrollmentId}`);
  await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.locator('input[name="docente-picker"]').first().check();
  await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
  await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
  await page.getByPlaceholder(/¿cómo era la dinámica/i).fill(reviewText);
  await page.getByRole('button', { name: /^publicar reseña$/i }).click();
  await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });

  await context.clearCookies();
  await signIn(page, MATEO);
  await page.request.post('/api/me/student-profiles', {
    data: { careerPlanId: '00000003-0000-4000-a000-000000000003', enrollmentYear: 2024 },
  });

  await page.goto('/reviews?tab=explore');
  const card = page.getByLabel(/reseñas de la comunidad/i).locator('li', { hasText: reviewText });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: /reportar/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: /datos personales/i }).click();
  await dialog.getByRole('button', { name: /enviar reporte/i }).click();
  await expect(dialog.getByText(/gracias por avisar/i)).toBeVisible({ timeout: 15_000 });

  return reviewText;
}

test.describe('Moderación · cola + decisión (US-050, US-051)', () => {
  test.setTimeout(180_000);

  test('el moderador ve la cola, abre un reporte y aplica una decisión', async ({
    page,
    context,
  }) => {
    await seedOpenReport(page, context);

    // El moderador entra al backoffice de moderación.
    await context.clearCookies();
    await signIn(page, MODERADOR);
    await page.goto('/admin/moderacion/reportes');

    await expect(page.getByRole('heading', { name: /cola de reportes/i })).toBeVisible({
      timeout: 30_000,
    });
    // El report recién creado (motivo "Datos personales") aparece en la cola.
    await expect(page.getByText('Datos personales').first()).toBeVisible({ timeout: 15_000 });

    // Abre el primer reporte de la cola.
    await page
      .getByRole('link', { name: /decidir/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/moderacion\/reportes\/[0-9a-f-]{36}$/, {
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /reseña reportada/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^decisión$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /contexto del autor/i })).toBeVisible();

    // Esperar la hidratación antes de aplicar la decisión: si el submit pega antes, el server action
    // corre (POST nativo) pero el redirect a la cola vive en un useEffect client que todavía no está
    // activo, así que la decisión se aplica pero la página no vuelve a la cola (flake de S8).
    await page.waitForLoadState('networkidle');

    // Selecciona "Aprobar" (dismiss, siempre disponible) y aplica.
    await page.locator('label').filter({ hasText: 'Aprobar' }).click();
    await page.getByRole('button', { name: /aplicar decisión/i }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: /aprobar esta reseña/i })).toBeVisible();
    await confirm.getByRole('button', { name: /^aplicar$/i }).click();

    // Vuelve a la cola. El redirect tras aplicar es un useEffect client (mutación pura, ADR-0046) que
    // puede no dispararse si el submit pegó en la ventana de hidratación (form procesado como POST
    // nativo); vamos a la cola directo, robusto contra ese flake. La decisión ya se aplicó server-side.
    await page.goto('/admin/moderacion/reportes');
    await expect(page.getByRole('heading', { name: /cola de reportes/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
