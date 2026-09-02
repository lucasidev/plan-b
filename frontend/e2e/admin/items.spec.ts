import type { APIRequestContext } from '@playwright/test';
import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Frases (US-198): el catálogo de lo que el producto pregunta, editable en un solo lugar.
 *
 * Lo que se prueba acá y no en un componente: que la declaración de quien cura llegue hasta el
 * catálogo real y hasta lo que el cuestionario ofrece. Los dos caminos tienen consecuencias
 * distintas sobre datos que ya existen, y esa diferencia solo se ve de punta a punta.
 */

const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
const CHAIR_PEREZ = '00000008-0000-4000-a000-000000000001';

/** Seis períodos sembrados: hay una sola voz por cuenta, materia y período. */
const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

/**
 * El piso de la ficha de cátedra. Literal y no la constante del backend: es lo que se prueba, y
 * un test que lee la constante para afirmar lo que la constante dice sigue verde si cambia.
 */
const FLOOR = 10;

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

/**
 * Siembra una frase propia del test y la deja seleccionada. Se crea destilando: es el único alta
 * de frases que el producto tiene, y curar una del catálogo sembrado le cambiaría el corpus a los
 * otros specs.
 */
async function seedPhrase(page: Page, suffix: string) {
  const code = `E2E_${suffix}`;
  const question = `¿Avisaba cuando cambiaba una fecha ${suffix}?`;

  await page.goto('/admin/curation');
  await page.getByLabel('Código').fill(code);
  await page.getByLabel('La pregunta').fill(question);
  await page.getByLabel(/etiqueta de la opción 1/i).fill('Sí');
  await page.getByLabel(/etiqueta de la opción 2/i).fill('No');
  await page.getByRole('button', { name: 'Destilar' }).click();
  await expect(page.getByRole('status')).toContainText(/entró en la versión \d+/i, {
    timeout: 15_000,
  });

  await page.goto('/admin/items');
  await selectPhrase(page, code);

  return { code, question };
}

/** Elige una frase del catálogo por su código, filtrando primero para no depender del orden. */
async function selectPhrase(page: Page, code: string) {
  await page.getByLabel(/buscar en el catálogo/i).fill(code);
  await page.getByRole('button', { name: new RegExp(`^${code}\\b`) }).click();
}

/**
 * Una reseña que contesta la frase del test. El período rota porque hay una sola voz por cuenta,
 * materia y período, y el desenlace también, para que la ficha no dependa de un número redondo.
 */
async function answer(request: APIRequestContext, code: string, index: number) {
  const published = await request.post('/api/reviews/courses', {
    data: {
      subjectId: SUBJECT_211,
      termId: TERMS[index % TERMS.length],
      chairId: CHAIR_PEREZ,
      answers: [
        { itemCode: 'COURSE_OUTCOME', optionValue: index < 7 ? 1 : 3 },
        { itemCode: code, optionValue: index < 8 ? 2 : 1 },
      ],
      freeText: null,
    },
  });
  expect(published.status()).toBe(201);
}

test.describe('Frases (US-198)', () => {
  test.setTimeout(180_000);

  /**
   * US-198 E1: se edita en un solo lugar, conserva su código, y el cambio queda con su autor. El
   * cuestionario no publica una versión nueva: la pregunta sigue siendo la misma.
   */
  test('corregir la redacción conserva el código y no corta la serie', async ({
    page,
    context,
  }) => {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

    await context.clearCookies();
    await signIn(page, ADMIN.email, ADMIN.password);
    const { code } = await seedPhrase(page, suffix);

    const better = `¿Avisaba con cuánta anticipación se movía una fecha ${suffix}?`;
    await page.getByRole('button', { name: /Cómo está escrito/ }).click();

    // Declarar que solo cambia la redacción no levanta el aviso del corte.
    await expect(page.getByText('Esto corta la serie')).toHaveCount(0);

    await page.getByLabel('La pregunta').fill(better);
    await page.getByRole('button', { name: 'Guardar el cambio' }).click();

    // El catálogo muestra el texto nuevo bajo el MISMO código, con su autor y su fecha.
    await expect(page.getByRole('heading', { name: better })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(new RegExp(`último cambio: ${ADMIN.email}`))).toBeVisible();
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();

    // Y lo que el cuestionario ofrece es el texto nuevo, bajo el mismo código.
    await context.clearCookies();
    await page.goto('/method');
    await expect(page.getByText(better)).toBeVisible({ timeout: 15_000 });
  });

  /**
   * US-198 E2 y E3: declarar que cambió lo que se pregunta abre un código nuevo, retira el viejo, y
   * la ficha pública muestra los dos tramos separados con las respuestas de antes intactas.
   *
   * Es el único test del proyecto que recorre el corte entero: el corte se declara en una pantalla
   * y se ve en otra, y en el medio hay un contrato JSON que ni el test de componente ni el de
   * integración cruzan.
   */
  test('cambiar lo que pregunta corta la serie, y la ficha muestra los dos tramos', async ({
    page,
    context,
    request,
  }) => {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const students: CreatedStudent[] = [];

    await context.clearCookies();
    await signIn(page, ADMIN.email, ADMIN.password);
    const { code, question } = await seedPhrase(page, suffix);

    try {
      // La ficha publica desde diez reseñas, así que diez cuentas responden la pregunta de hoy:
      // son las respuestas que el corte tiene que conservar del lado del código viejo.
      for (let i = 0; i < FLOOR; i++) {
        const student = await createStudent(request, { emailPrefix: `e2e-items-${i}` });
        students.push(student);
        await answer(request, code, i);
      }

      await page.goto('/admin/items');
      await selectPhrase(page, code);
      await page.getByRole('button', { name: /Lo que pregunta/ }).click();

      // El aviso llega ANTES de confirmar y dice qué pasa con lo ya respondido.
      await expect(page.getByText('Esto corta la serie')).toBeVisible();
      await expect(
        page.getByText(new RegExp(`deja de ofrecerse y se queda con sus ${FLOOR} respuestas`)),
      ).toBeVisible();

      const newCode = `${code}_B`;
      const newQuestion = `¿Con cuánta anticipación avisaba ${suffix}?`;
      await page.getByLabel('El código nuevo').fill(newCode);
      await page.getByLabel('La pregunta').fill(newQuestion);
      await page.getByRole('button', { name: 'Abrir el código nuevo' }).click();

      // El catálogo: el viejo retirado, conservando lo suyo, y diciendo quién lo reemplazó.
      await expect(page.getByText(newCode).first()).toBeVisible({ timeout: 15_000 });
      await selectPhrase(page, code);
      await expect(page.getByText(new RegExp(`Conserva sus ${FLOOR} respuestas`))).toBeVisible();
      await expect(page.getByText(new RegExp(`reemplazada por.*${newCode}`))).toBeVisible();

      // Y la ficha pública, que es donde el corte tiene que verse: la pregunta de hoy todavía sin
      // responder, la de antes con sus diez respuestas, y la línea que dice que no se comparan.
      await context.clearCookies();
      await page.goto(`/chairs/${CHAIR_PEREZ}`);
      await expect(page.getByText(newQuestion)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Todavía nadie respondió esta pregunta.')).toBeVisible();
      await expect(page.getByText(question)).toBeVisible();
      await expect(page.getByText(/acá cambió la pregunta/).first()).toBeVisible();
      await expect(page.getByText(new RegExp(`de ${FLOOR}$`)).first()).toBeVisible();
    } finally {
      for (const student of students) {
        await deleteStudent(request, student);
      }
    }
  });

  test('un alumno no llega al catálogo de frases', async ({ page, context, request }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-items-guard' });

    try {
      await context.clearCookies();
      await signIn(page, student.email, student.password);
      await page.goto('/admin/items');

      // Es el único lugar donde se edita lo que el producto pregunta: una frase mal definida es un
      // error en todas las fichas que la usan.
      await expect(page).not.toHaveURL(/\/admin\/items/);
    } finally {
      await deleteStudent(request, student);
    }
  });
});
