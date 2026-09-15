import { expect, type Page, test } from '@playwright/test';
import { CHAIR_PEREZ, publishByApi, SUBJECT_211 } from '../helpers/reviews';
import { createStudent, deleteStudent } from '../helpers/students';

/**
 * Protege la navegación sin recarga entre rutas de (planb) con páginas del slot @crumbs de
 * distinto tipo (estática, force-dynamic o resuelta por pedido): un caso que solo rompía el
 * router en el build de producción, nunca en dev (`@crumbs/_lib/generic-crumbs.tsx`).
 */

// Fernández (Sid 01): la misma cátedra sin corpus que usa `method.spec.ts` para este mismo
// camino (ficha de cátedra → Método).
const CHAIR_WITHOUT_CORPUS = '00000008-0000-4000-a000-000000000009';

// La Tecnicatura Universitaria en Desarrollo y Calidad de Software (UNSTA): tiene hermanas en
// UNT y UTN (misma carrera canónica), así "Dónde estudiarla" tiene con qué comparar.
const TUDCS_CAREER_ID = '00000002-0000-4000-a000-000000000003';

// González, la otra cátedra de 211 sembrada en AcademicSeedData.cs junto con Pérez: con una
// reseña propia (creada en el test) aparece como hermana en la ficha de Pérez.
const CHAIR_GONZALEZ = '00000008-0000-4000-a000-000000000002';

// Un período sembrado de 211 (mismo pool que usa path-to-the-ficha.spec.ts), sin corpus de
// reseñas previo: sin PLANB_SEED_CORPUS las cátedras de 211 existen pero arrancan en cero, así
// que la fila de la cátedra y "Las hermanas" necesitan al menos una reseña creada por el test.
const TERM_211 = '00000005-0000-4000-a000-000000000001';

// Por debajo de `lg` (1024px) el sidebar y las migas del topbar quedan `hidden` (mismo
// breakpoint en `Sidebar` y `Topbar`): los caminos que dependen de uno de los dos son solo de
// escritorio.
function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 1024;
}

test.describe('Navegación suave entre rutas de (planb)', () => {
  test('de /careers a la ficha de una carrera de "En una sola institución"', async ({ page }) => {
    await page.goto('/careers');
    const singleInstitution = page.locator('section[aria-labelledby="single-institution-heading"]');
    await singleInstitution.getByRole('link').first().click();

    await expect(page).toHaveURL(/\/careers\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la ficha de materia a la universidad, por la miga "UNSTA"', async ({ page }) => {
    test.skip(!isDesktopViewport(page), 'las migas del topbar quedan hidden por debajo de lg');

    await page.goto(`/subjects/${SUBJECT_211}`);
    const crumbs = page.getByRole('navigation', { name: 'Dónde estás' });
    await crumbs.getByRole('link', { name: 'UNSTA' }).click();

    await expect(page).toHaveURL(/\/universities\/unsta\/careers$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la ficha de cátedra a Explorar, por la miga del topbar', async ({ page }) => {
    test.skip(!isDesktopViewport(page), 'las migas del topbar quedan hidden por debajo de lg');

    await page.goto(`/chairs/${CHAIR_PEREZ}`);
    const crumbs = page.getByRole('navigation', { name: 'Dónde estás' });
    await crumbs.getByRole('link', { name: 'Explorar' }).click();

    await expect(page).toHaveURL(/\/universities$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de /universities a la ficha de una universidad, por la fila de la lista', async ({
    page,
  }) => {
    await page.goto('/universities');
    await page.getByRole('link', { name: /Universidad del Norte Santo Tomás de Aquino/i }).click();

    await expect(page).toHaveURL(/\/universities\/unsta\/careers$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de Método a Explorar, por el sidebar', async ({ page }) => {
    test.skip(!isDesktopViewport(page), 'el sidebar no se renderiza por debajo de lg');

    await page.goto('/method');
    await page.locator('aside').getByRole('link', { name: 'Explorar' }).click();

    await expect(page).toHaveURL(/\/universities$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la universidad a la ficha de la Tecnicatura, por la fila de la carrera', async ({
    page,
  }) => {
    await page.goto('/universities/unsta/careers');
    // Con reseñas, la Tecnicatura también aparece en "Por dónde empezar" (columna derecha); el
    // camino de este test es la fila de la carrera en "Facultades y carreras".
    const careersByFaculty = page
      .locator('section.pb-section')
      .filter({ has: page.getByText('Facultades y carreras', { exact: true }) });
    await careersByFaculty
      .getByRole('link', {
        name: /Tecnicatura Universitaria en Desarrollo y Calidad de Software/i,
      })
      .click();

    await expect(page).toHaveURL(new RegExp(`/careers/${TUDCS_CAREER_ID}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de Dónde estudiarla a la ficha de la carrera, por el link a UNSTA', async ({ page }) => {
    await page.goto(`/careers/${TUDCS_CAREER_ID}/where-to-study`);
    await page.getByRole('link', { name: /Universidad del Norte Santo Tomás de Aquino/i }).click();

    await expect(page).toHaveURL(new RegExp(`/careers/${TUDCS_CAREER_ID}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la ficha de cátedra a Método, por "¿Cómo calculamos esto?"', async ({ page }) => {
    await page.goto(`/chairs/${CHAIR_WITHOUT_CORPUS}`);
    await page.getByRole('link', { name: /cómo calculamos esto/i }).click();

    await expect(page).toHaveURL(/\/method$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la ficha de materia a Sobre plan-b, por el sidebar', async ({ page }) => {
    test.skip(!isDesktopViewport(page), 'el sidebar no se renderiza por debajo de lg');

    await page.goto(`/subjects/${SUBJECT_211}`);
    await page.locator('aside').getByRole('link', { name: 'Sobre plan-b' }).click();

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de Sobre plan-b a Ayuda, por el sidebar', async ({ page }) => {
    test.skip(!isDesktopViewport(page), 'el sidebar no se renderiza por debajo de lg');

    await page.goto('/about');
    await page.locator('aside').getByRole('link', { name: 'Ayuda' }).click();

    await expect(page).toHaveURL(/\/help$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de la ficha de la materia 211 a una de sus cátedras, por la fila de la cátedra', async ({
    page,
    request,
  }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-soft-nav-subject-chair' });
    try {
      await publishByApi(request, student, TERM_211, 1);

      await page.goto(`/subjects/${SUBJECT_211}`);
      await page
        .getByRole('link', { name: /^Cátedra Pérez/i })
        .first()
        .click();

      await expect(page).toHaveURL(new RegExp(`/chairs/${CHAIR_PEREZ}$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/application error/i)).toHaveCount(0);
    } finally {
      await deleteStudent(request, student);
    }
  });

  test('de la ficha de la carrera TUDCS a la materia 211, por el plan', async ({ page }) => {
    await page.goto(`/careers/${TUDCS_CAREER_ID}`);
    // Acotado a `.pb-plan` (el plan vigente, no "Por dónde empezar" del aside): las dos secciones
    // pueden nombrar la misma materia si junta reseñas, y el link sin acotar sería ambiguo.
    await page
      .locator('.pb-plan')
      .getByRole('link', { name: /Fundamentos de Control de Calidad/i })
      .click();

    await expect(page).toHaveURL(new RegExp(`/subjects/${SUBJECT_211}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/application error/i)).toHaveCount(0);
  });

  test('de una ficha de cátedra a una cátedra hermana, por "Las hermanas"', async ({
    page,
    request,
  }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-soft-nav-siblings' });
    try {
      // `publishByApi` reseña siempre contra Pérez: González necesita su propia reseña para que
      // `chairs/[id]/page.tsx` la sume a `siblings` (reviewCount > 0) en la ficha de Pérez.
      await request.post('/api/identity/sign-in', {
        data: { email: student.email, password: student.password },
      });
      await request.post('/api/reviews/courses', {
        data: {
          subjectId: SUBJECT_211,
          termId: TERM_211,
          chairId: CHAIR_GONZALEZ,
          answers: [
            { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
            { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
            { itemCode: 'CHAIR_CLASSES_HELD', optionValue: 3 },
          ],
          freeText: null,
        },
      });

      await page.goto(`/chairs/${CHAIR_PEREZ}`);
      await page.getByRole('link', { name: /^Cátedra González/i }).click();

      await expect(page).toHaveURL(new RegExp(`/chairs/${CHAIR_GONZALEZ}$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/application error/i)).toHaveCount(0);
    } finally {
      await deleteStudent(request, student);
    }
  });
});
