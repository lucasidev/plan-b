import { expect, type Page, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * Historial académico de Mi carrera (US-045-e, read de US-013).
 *
 * Cubre la cadena que ningún test de nivel más bajo ve: página → fetch al backend → render.
 * El bug que motivó este spec era exactamente esa cadena: la cursada se persistía bien y la
 * pantalla decía "Tu historial está vacío", porque `my-career/page.tsx` renderizaba
 * `<HistoryTab />` sin props y el componente caía siempre en el empty state. Los tests de
 * componente pasaban (le pasaban períodos a mano) y el endpoint no existía, así que nada
 * fallaba mientras la pantalla mentía.
 *
 * Por eso vive en E2E y no un nivel más abajo (ADR-0036: subir un nivel solo si el inferior
 * no alcanza). Acá el inferior no alcanza: el defecto era el cableado entre las dos piezas
 * que sí estaban testeadas.
 */

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(LUCIA.email);
  await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/home/);
}

/**
 * Devuelve el value + el texto de la primera opción real (no placeholder) de un select. Se
 * resuelve en runtime porque el catálogo lo sirve el backend: hardcodear un id de materia o de
 * período ataría el spec al seed.
 */
async function firstRealOption(
  page: Page,
  label: RegExp,
): Promise<{ value: string; text: string }> {
  // El form monta con un "Cargando materias y cuatrimestres..." mientras resuelven las queries
  // del catálogo, y `count()` no auto-espera como los matchers: sin este await, enumerar las
  // opciones devuelve cero y parece que el select vino vacío.
  await expect(page.getByLabel(label)).toBeVisible();

  const options = page.getByLabel(label).locator('option');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const value = (await options.nth(i).getAttribute('value')) ?? '';
    const text = (await options.nth(i).textContent())?.trim() ?? '';
    if (value === '') continue;
    return { value, text };
  }
  throw new Error(`No hay ninguna opción seleccionable en el select "${label}"`);
}

test.describe('Mi carrera: historial', () => {
  /**
   * Un solo test que recorre el loop entero en vez de dos, y a propósito: el spec no puede
   * asumir cursadas pre-cargadas. El stack de E2E siembra personas pero no el corpus de demo
   * (eso lo hace `just dev-scratch`), así que la única cursada de la que este spec puede
   * hablar es la que él mismo carga. Un test que dependiera del corpus pasaría local y se
   * caería en CI, que es exactamente lo que pasó la primera vez que lo escribí así.
   */
  test('una materia cargada aparece en el historial con sus datos reales', async ({ page }) => {
    await signIn(page);
    await page.goto('/my-career/transcript/add');

    // La materia y el período se resuelven en runtime: hardcodear ids ataría el spec al seed.
    const subject = await firstRealOption(page, /^Materia$/);
    await page.getByLabel(/^Materia$/).selectOption(subject.value);
    await page.getByLabel(/^Estado$/).selectOption('Passed');
    await page.getByLabel(/Forma de aprobación/i).selectOption('FinalExam');

    const term = await firstRealOption(page, /^Cuatrimestre$/);
    await page.getByLabel(/^Cuatrimestre$/).selectOption(term.value);
    await page.getByLabel(/Nota final/i).fill('8');

    await page.getByRole('button', { name: /cargar entrada/i }).click();

    // El action redirige al historial. Que la materia recién cargada se vea acá es lo que
    // prueba el loop completo: write, redirect, y el read sirviendo dato fresco.
    await expect(page).toHaveURL(/\/my-career\?tab=transcript/);

    // La aserción central del bug: con una cursada cargada, el empty state no puede seguir.
    // Eso es lo que la pantalla mostraba igual, porque nadie le pasaba los datos.
    await expect(page.getByText(/Tu historial está vacío/i)).toHaveCount(0);

    // El nombre viene del option del select (`CODIGO · Nombre (Nº año...)`), así que se
    // compara contra el nombre solo, que es lo que el historial renderea.
    const subjectName = subject.text.split('·')[1]?.split('(')[0]?.trim() ?? subject.text;
    await expect(page.getByText(subjectName)).toBeVisible();

    // El período y el chip de estado salen del read, no de un mock. `exact` en el chip porque
    // "aprobada" también es substring del KPI "materias aprobadas".
    await expect(page.getByText(term.text, { exact: true })).toBeVisible();
    await expect(page.getByText('aprobada', { exact: true })).toBeVisible();

    // Los KPIs se calculan sobre lo que llegó del backend.
    await expect(page.getByText('materias aprobadas')).toBeVisible();
    await expect(page.getByText('promedio general')).toBeVisible();
  });
});
