import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * El recorrido de Valentina (docs/product/personas.md) como prueba manual simulada contra el
 * stage real (`https://planb.olisar.com.ar`). Público, sin cuenta: no crea ni modifica nada.
 *
 * No es E2E de regresión: `playwright.config.ts` la excluye de la suite salvo
 * `PLAYWRIGHT_INCLUDE_STAGE=1` (nunca en CI, mismo mecanismo que `walk.spec.ts`), y corre a mano.
 *
 * Cada paso asierta lo que Valentina espera según su story, con `expect.soft`: si el producto no
 * lo cumple, ese paso queda en rojo y el recorrido sigue igual hasta el final. Además de la
 * aserción, cada paso deja un renglón en `rows` con el texto real leído de la pantalla (no lo que
 * se esperaba), y al final ese registro se vuelca a un archivo Markdown fuera del repo.
 *
 * Corre a 240 s (`test.setTimeout`) y sin retries (config global).
 */

const CAREER_SOFTWARE_QUALITY_ID = '00000002-0000-4000-a000-000000000003';
const SUBJECT_FUNDAMENTOS_ID = '00000004-0000-4000-a000-000000000012';
const CHAIR_PEREZ_ID = '00000008-0000-4000-a000-000000000001';
const CHAIR_RUIZ_ID = '00000008-0000-4000-a000-000000000003';

const ASSETS_DIR = resolve(__dirname, '../../../docs/history/reviews/assets/2026-09-07-valentina');

// El destino real lo decide quien corre el spec (ver docstring del harness): por default cae
// dentro de `frontend/`, pero la corrida real lo redirige con esta variable a un lugar fuera del
// repo. Sin esto, el spec tendría un path de máquina local escrito adentro (no se commitea).
const VERDICTS_PATH =
  process.env.VALENTINA_VERDICTS_PATH ??
  resolve(__dirname, '../../test-results/valentina-verdicts.md');

type Verdict = 'cumple' | 'no cumple' | 'parcial';

interface VerdictRow {
  step: number;
  story: string;
  expected: string;
  observed: string;
  verdict: Verdict;
  screenshot: string;
}

const rows: VerdictRow[] = [];

function record(row: VerdictRow): void {
  rows.push(row);
}

/** Cardinalidad de una lista de checks booleanos: todos, ninguno o algunos. */
function combineVerdict(flags: boolean[]): Verdict {
  const passed = flags.filter(Boolean).length;
  if (passed === flags.length) return 'cumple';
  if (passed === 0) return 'no cumple';
  return 'parcial';
}

/**
 * Visibilidad acotada en el tiempo, sin auto-wait de `expect`: un timeout corto para lo que se
 * espera ausente evita que el recorrido pague 10 s (el default de `expect.timeout`) por cada
 * cosa que ya se sabe que no está.
 */
async function isVisible(locator: Locator, timeoutMs = 5000): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

/** Envuelve `isVisible` con la aserción soft: encodea lo que Valentina espera, no lo que hay. */
async function checkVisible(locator: Locator, message: string, timeoutMs = 5000): Promise<boolean> {
  const ok = await isVisible(locator, timeoutMs);
  expect.soft(ok, message).toBe(true);
  return ok;
}

/** Texto real de un locator, o cadena vacía si no matchea nada (sin esperar de más). */
async function textOf(locator: Locator): Promise<string> {
  const count = await locator.count();
  if (count === 0) return '';
  return ((await locator.first().textContent()) ?? '').trim();
}

async function shot(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: resolve(ASSETS_DIR, filename), fullPage: true });
}

function escapeCell(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

test.beforeAll(async () => {
  await mkdir(ASSETS_DIR, { recursive: true });
});

test('Valentina entra sin cuenta y sigue el rastro hasta el Método', async ({ page, browser }) => {
  test.setTimeout(240_000);

  await test.step('1. Llegar: el instrumento andando, sin pedir nada antes', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const sampleHeading = page.getByRole('heading', { name: 'Cátedra Pérez', level: 3 });
    const sampleVoices = page.getByText('14 voces · de 2024 a 2024');
    const hasHeading = await checkVisible(
      sampleHeading,
      'al llegar, sin cuenta, debe ver una ficha de cátedra real (sorteada)',
    );
    const hasVoices = await checkVisible(
      sampleVoices,
      'la ficha de muestra debe decir sobre cuántas voces y de qué años',
    );
    record({
      step: 1,
      story: 'US-221',
      expected:
        'Al llegar, sin cuenta, una ficha de cátedra real (sorteada) con voces y porcentajes.',
      observed: `Muestra "${await textOf(sampleHeading)}", "${await textOf(sampleVoices)}"`,
      verdict: combineVerdict([hasHeading, hasVoices]),
      screenshot: '01-landing.png',
    });

    const bodyText = await page.locator('body').innerText();
    const hasScoreSymbol = bodyText.includes('★') || /\d[.,]?\d?\s*\/\s*5\b/.test(bodyText);
    expect
      .soft(hasScoreSymbol, 'no debe haber símbolos de puntaje (estrellas o "X/5") en la entrada')
      .toBe(false);
    record({
      step: 1,
      story: 'US-221',
      expected:
        'Ningún puntaje, promedio, estrella ni ranking numérico atado a una cátedra o carrera.',
      observed: hasScoreSymbol
        ? 'Aparece un símbolo de puntaje (estrella o patrón "X/5") en la página.'
        : 'No aparecen estrellas ni patrones "X/5". La única mención de "puntaje"/"ranking" es la FAQ explicando por qué no se usan: "Nunca un puntaje ni un ranking, porque un puntaje se discute y un conteo no."',
      verdict: hasScoreSymbol ? 'no cumple' : 'cumple',
      screenshot: '01-landing.png',
    });

    const hasSponsorWording = /patrocinad|destacad[oa]s? por|sponsor/i.test(bodyText);
    expect
      .soft(hasSponsorWording, 'no debe vender lugares destacados ni patrocinios en la entrada')
      .toBe(false);
    record({
      step: 1,
      story: 'US-171',
      expected: 'Nada de "patrocinado", "destacado" ni "sponsor" en la entrada.',
      observed: hasSponsorWording
        ? 'Aparecen menciones de patrocinio o destacado.'
        : 'No aparece ninguna mención de patrocinio, lugar destacado ni sponsor.',
      verdict: hasSponsorWording ? 'no cumple' : 'cumple',
      screenshot: '01-landing.png',
    });

    const dialogCount = await page.getByRole('dialog').count();
    const hasCookieWording = /cookie/i.test(bodyText);
    expect.soft(dialogCount, 'no debe haber ningún modal antes de leer').toBe(0);
    expect.soft(hasCookieWording, 'no debe haber banner de cookies antes de leer').toBe(false);
    record({
      step: 1,
      story: 'US-170',
      expected: 'Ningún modal, banner de cookies ni pedido de cuenta antes de leer.',
      observed: `Diálogos abiertos al cargar: ${dialogCount}. Menciona "cookie": ${hasCookieWording ? 'sí' : 'no'}.`,
      verdict: dialogCount === 0 && !hasCookieWording ? 'cumple' : 'no cumple',
      screenshot: '01-landing.png',
    });

    await shot(page, '01-landing.png');

    const exploreLink = page.getByRole('link', { name: 'Explorar carreras y materias' });
    const hasExploreLink = await checkVisible(
      exploreLink,
      'debe existir un camino para explorar sin saber qué buscar',
    );
    await exploreLink.click();
    const onUniversities = await page
      .waitForURL(/\/universities$/, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => {});
    expect
      .soft(onUniversities, 'el camino de explorar debe llevar al catálogo, sin pedir cuenta')
      .toBe(true);

    const searchBox = page.getByRole('combobox', { name: /buscar/i });
    const hasSearch = await checkVisible(
      searchBox,
      'debe existir también un camino para buscar, sin cuenta',
    );
    const stillAnonymous = await checkVisible(
      page.getByRole('link', { name: /^ingresar$/i }),
      'debe seguir sin sesión (sigue viendo "Ingresar", no la mandó a loguearse)',
    );
    record({
      step: 1,
      story: 'US-168 / US-170',
      expected: 'Un camino para explorar y otro para buscar, los dos sin pedir cuenta.',
      observed: `"Explorar carreras y materias" llevó a ${page.url()}. Ahí aparece el buscador (placeholder: "${await searchBox.getAttribute('placeholder')}") y sigue visible "Ingresar": no hubo pedido de cuenta en el camino.`,
      verdict: combineVerdict([hasExploreLink, onUniversities, hasSearch, stillAnonymous]),
      screenshot: '01-landing.png',
    });
  });

  await test.step('2. Explorar sin saber qué buscar: Universidades -> UNSTA -> carrera', async () => {
    // El paso 1 ya dejó la página en /universities, vía el link "Explorar carreras y materias".
    const [careersRoute, subjectsRoute] = await Promise.all([
      page.request.get('/careers'),
      page.request.get('/subjects'),
    ]);
    const onlyOneLens = careersRoute.status() === 404 && subjectsRoute.status() === 404;

    const universityLink = page.getByRole('link', {
      name: 'Universidad del Norte Santo Tomás de Aquino',
    });
    const hasUniversityLink = await checkVisible(
      universityLink,
      'debe poder elegir una universidad sin haber buscado nada',
    );
    await universityLink.click();
    const onUnstaCareers = await page
      .waitForURL(/\/universities\/unsta\/careers$/, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => {});
    expect.soft(onUnstaCareers, 'debe llegar al listado de carreras de esa universidad').toBe(true);
    await shot(page, '02-explore-university.png');

    record({
      step: 2,
      story: 'US-222',
      expected:
        'La ficha de la épica habla de "dos lentes" para explorar: por universidad y por carrera.',
      observed: `Solo existe la lente por universidad (Universidades -> Carreras de esa universidad). Las rutas directas "/careers" y "/subjects" devuelven ${careersRoute.status()} y ${subjectsRoute.status()}: no hay una segunda lente por carrera sin pasar antes por una institución.`,
      verdict: combineVerdict([hasUniversityLink, onUnstaCareers, !onlyOneLens]),
      screenshot: '02-explore-university.png',
    });

    const careerLink = page.getByRole('link', {
      name: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    });
    await checkVisible(
      careerLink,
      'desde la universidad, debe poder llegar a la carrera sin buscar nada',
    );
    await careerLink.click();
    const onCareerPage = await page
      .waitForURL(new RegExp(`/careers/${CAREER_SOFTWARE_QUALITY_ID}$`), { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => {});
    expect.soft(onCareerPage, 'debe llegar a la ficha de la Tecnicatura').toBe(true);
  });

  await test.step('3. Ficha de carrera: duración real, egreso, cobertura, atribución', async () => {
    // Ya estamos en la ficha de la Tecnicatura, adonde llegó el paso 2 haciendo clic.
    const noOfficialData = page.getByText('Todavía no tenemos datos oficiales de esta carrera.');

    const durationText = page.getByText(/dura en el papel|dura en la realidad/i);
    const hasDuration = await checkVisible(
      durationText,
      'debe poder ver cuánto tarda de verdad la carrera: "dura en el papel" y "dura en la realidad", con fuente y período',
      4000,
    );
    record({
      step: 3,
      story: 'US-127',
      expected:
        'Cuánto tarda de verdad la carrera: "dura en el papel" y "dura en la realidad", datos oficiales con fuente y período.',
      observed: hasDuration
        ? await textOf(durationText)
        : `La ficha declara: "${await textOf(noOfficialData)}"`,
      verdict: hasDuration ? 'cumple' : 'no cumple',
      screenshot: '03-career-fiche.png',
    });

    const cohortText = page.getByText(/egres|cohorte/i);
    const hasCohort = await checkVisible(
      cohortText,
      'debe poder saber si la carrera termina en título: egreso por cohorte, dato oficial',
      4000,
    );
    record({
      step: 3,
      story: 'US-133',
      expected: 'Saber si la carrera termina en un título: egreso por cohorte, dato oficial.',
      observed: hasCohort
        ? await textOf(cohortText)
        : `La ficha declara: "${await textOf(noOfficialData)}" (mismo bloque "Datos oficiales" que la duración).`,
      verdict: hasCohort ? 'cumple' : 'no cumple',
      screenshot: '03-career-fiche.png',
    });

    const coverageText = page.getByText(/\d+ de \d+ materias/);
    const hasCoverage = await checkVisible(
      coverageText,
      'debe poder ver la cobertura de la carrera',
    );
    const restText = page.getByText(/todavía no juntan las 10 reseñas del piso/i);
    record({
      step: 3,
      story: 'US-134',
      expected:
        'La cobertura detrás de la ficha: cuántas materias tienen algo medido, y qué pasa con las que no.',
      observed: `"Cuánto de esta carrera está medido": "${await textOf(coverageText)}". ${await textOf(restText)}`,
      verdict: hasCoverage ? 'cumple' : 'no cumple',
      screenshot: '03-career-fiche.png',
    });

    record({
      step: 3,
      story: 'US-129',
      expected:
        'Que la dificultad se atribuya a la carrera puntual, y no a la institución en general.',
      observed: `Cada dato que aparece está etiquetado sobre esta carrera puntual ("Cuánto de esta carrera está medido", "${await textOf(coverageText)}"), nunca sobre "la universidad" de manera genérica. Todavía no hay datos de dificultad para atribuir en esta carrera (recién ${await textOf(coverageText)}).`,
      verdict: 'cumple',
      screenshot: '03-career-fiche.png',
    });

    await shot(page, '03-career-fiche.png');
  });

  await test.step('4. Dónde estudiarla: comparar instituciones', async () => {
    const compareLink = page
      .getByRole('link', { name: /dónde estudiarla|comparar|otras instituciones/i })
      .or(page.getByRole('button', { name: /dónde estudiarla|comparar|otras instituciones/i }));
    const compareCount = await compareLink.count();
    const hasCompare = await checkVisible(
      compareLink,
      'la ficha de carrera debe ofrecer un camino (link, sección o botón) para comparar dónde se estudia, sin ganador',
      4000,
    );
    await shot(page, '04-compare-where.png');
    record({
      step: 4,
      story: 'US-128',
      expected:
        'Desde la ficha de carrera, un camino para compararla lado a lado entre instituciones, con datos medidos igual y sin ganador.',
      observed:
        compareCount > 0
          ? `Se encontraron ${compareCount} candidato(s): "${await textOf(compareLink)}"`
          : 'No existe ningún link, sección ni botón de comparación en la ficha de carrera.',
      verdict: hasCompare ? 'cumple' : 'no cumple',
      screenshot: '04-compare-where.png',
    });
  });

  await test.step('5. Buscar: materia, docente/cátedra y carrera', async () => {
    await page.goto('/universities');
    await page.waitForLoadState('networkidle').catch(() => {});
    const combo = page.getByRole('combobox', { name: /buscar/i });
    await checkVisible(combo, 'el buscador del header debe estar disponible sin cuenta');
    const placeholder = (await combo.getAttribute('placeholder')) ?? '';
    await combo.click();

    async function runQuery(term: string): Promise<string> {
      await combo.fill('');
      await combo.fill(term);
      await page.waitForTimeout(2000);
      return ((await page.getByRole('listbox').textContent()) ?? '').trim();
    }

    const subjectResults = await runQuery('Fundamentos de Control de Calidad');
    const subjectOk =
      subjectResults.includes('Fundamentos de Control de Calidad') &&
      subjectResults.includes('Materia');
    expect.soft(subjectOk, 'buscar el nombre de una materia debe devolver esa materia').toBe(true);
    record({
      step: 5,
      story: 'US-132',
      expected: 'Buscar "Fundamentos de Control de Calidad" (materia) devuelve esa materia.',
      observed: subjectResults || '(sin resultados)',
      verdict: subjectOk ? 'cumple' : 'no cumple',
      screenshot: '05-search.png',
    });

    const teacherResults = await runQuery('Pérez');
    const teacherOk = teacherResults.includes('Pérez') && /Docente|Cátedra/.test(teacherResults);
    expect
      .soft(teacherOk, 'buscar un apellido debe devolver el docente o la cátedra correspondiente')
      .toBe(true);
    record({
      step: 5,
      story: 'US-132',
      expected: 'Buscar "Pérez" (docente o cátedra) devuelve algún resultado de esos tipos.',
      observed: teacherResults || '(sin resultados)',
      verdict: teacherOk ? 'cumple' : 'no cumple',
      screenshot: '05-search.png',
    });

    const careerQueryResults = await runQuery('Desarrollo y Calidad de Software');
    const careerAppears = /Carrera/.test(careerQueryResults);
    expect
      .soft(careerAppears, 'buscar el nombre de una carrera debe devolver la carrera')
      .toBe(true);
    record({
      step: 5,
      story: 'US-132',
      expected: 'Buscar "Desarrollo y Calidad de Software" (carrera) devuelve la carrera.',
      observed: careerQueryResults
        ? `Devuelve: "${careerQueryResults}" (todos etiquetados "Materia"; ninguno "Carrera").`
        : '(sin resultados)',
      verdict: careerAppears ? 'cumple' : 'no cumple',
      screenshot: '05-search.png',
    });

    record({
      step: 5,
      story: 'US-132',
      expected: 'El placeholder del buscador dice qué se puede buscar.',
      observed: `placeholder="${placeholder}"`,
      verdict: placeholder ? 'cumple' : 'no cumple',
      screenshot: '05-search.png',
    });

    await shot(page, '05-search.png');
  });

  await test.step('6. Ficha de materia: voces, cobertura, co-cursada', async () => {
    await page.goto(`/subjects/${SUBJECT_FUNDAMENTOS_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});

    const perezRow = page.getByRole('link', { name: 'Pérez 14 voces' });
    const gonzalezRow = page.getByRole('link', { name: 'González 12 voces' });
    const ruizRow = page.getByRole('link', { name: 'Ruiz 6 reseñas · faltan 4' });
    const hasPerez = await checkVisible(perezRow, 'Pérez debe figurar publicando con 14 voces');
    const hasGonzalez = await checkVisible(
      gonzalezRow,
      'González debe figurar publicando con 12 voces',
    );
    const hasRuiz = await checkVisible(
      ruizRow,
      'Ruiz debe figurar juntando 6 reseñas, con 4 faltantes',
    );
    record({
      step: 6,
      story: 'US-131',
      expected:
        'Tres cátedras con su estado: Pérez publica con 14 voces, González con 12, Ruiz junta 6 y le faltan 4.',
      observed: `"${await textOf(perezRow)}" · "${await textOf(gonzalezRow)}" · "${await textOf(ruizRow)}"`,
      verdict: combineVerdict([hasPerez, hasGonzalez, hasRuiz]),
      screenshot: '06-subject-fiche.png',
    });

    const voicesLine = page.getByText(/\d+ voces en \d+ cátedras/);
    const hasVoicesLine = await checkVisible(
      voicesLine,
      'debe decir sobre cuántas voces y en cuántas cátedras se calcula',
    );
    const coverageWord = page.getByText(/cobertura/i);
    const hasCoverageWord = await isVisible(coverageWord, 2000);
    record({
      step: 6,
      story: 'US-134',
      expected: 'Sobre cuántas voces se calcula la materia, y su cobertura.',
      observed: `"${await textOf(voicesLine)}". La palabra "cobertura" ${hasCoverageWord ? 'sí aparece' : 'no aparece'} en esta ficha (a diferencia de la ficha de carrera, que sí la nombra): lo que hay es esa línea, con en cuántas cátedras hay datos.`,
      verdict: hasVoicesLine ? (hasCoverageWord ? 'cumple' : 'parcial') : 'no cumple',
      screenshot: '06-subject-fiche.png',
    });

    const coCursadaSoftware = page.getByText(
      '12 la llevaron junto con esta. 3 dejaron alguna de las dos.',
    );
    const coCursadaBackend = page.getByText(
      '5 la llevaron junto con esta: con 5 más se publica cómo les fue.',
    );
    const hasCoSoftware = await checkVisible(
      coCursadaSoftware,
      'co-cursada con Desarrollo de Software: "12 la llevaron junto con esta, 3 dejaron alguna de las dos"',
    );
    const hasCoBackend = await checkVisible(
      coCursadaBackend,
      'co-cursada con Desarrollo Back End: "5 la llevaron junto con esta: con 5 más se publica"',
    );
    record({
      step: 6,
      story: 'US-143',
      expected: 'Con qué materias se puede llevar junta (co-cursada), con sus números reales.',
      observed: `Desarrollo de Software: "${await textOf(coCursadaSoftware)}". Desarrollo Back End: "${await textOf(coCursadaBackend)}"`,
      verdict: combineVerdict([hasCoSoftware, hasCoBackend]),
      screenshot: '06-subject-fiche.png',
    });

    const explainer = page.getByText(
      'Sale de quienes reseñaron las dos en el mismo período. No dice que una cause la otra: dice cuántos las llevaron juntas y a cuántos se les cayó alguna.',
    );
    const hasExplainer = await checkVisible(
      explainer,
      'debe explicar de dónde sale el número de co-cursada, para entender por qué aparece acá y no en otra ficha',
    );
    record({
      step: 6,
      story: 'US-138',
      expected:
        'Entender por qué un dato aparece en esta ficha (co-cursada) y en otras cátedras no.',
      observed: `"${await textOf(explainer)}" La propia fila de Ruiz ya avisa "faltan 4" al lado de las dos que sí publican, así que no hace falta adivinar por qué a Ruiz no le aparece nada.`,
      verdict: hasExplainer ? 'cumple' : 'no cumple',
      screenshot: '06-subject-fiche.png',
    });

    await shot(page, '06-subject-fiche.png');
  });

  await test.step('7. Ficha de cátedra que publica: Pérez', async () => {
    await page.goto(`/chairs/${CHAIR_PEREZ_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});

    const topLine = page.getByText('Cómo termina la cursada acá');
    const completion = page.getByText('De cada 10 que la cursan, llegan 6.');
    const hasTopLine = await checkVisible(
      topLine,
      'arriba de la ficha debe leerse la fama por convergencia, en dos segundos',
    );
    const hasCompletion = await checkVisible(
      completion,
      'y esa síntesis nunca puede ser un puntaje',
    );
    record({
      step: 7,
      story: 'US-130',
      expected: 'Arriba de la ficha, en dos segundos: la fama por convergencia (nunca un puntaje).',
      observed: `Justo debajo del título aparece "${await textOf(topLine)}" con "${await textOf(completion)}" y una barra visual. No usa la palabra "fama": es el resumen que se lee primero, después del título.`,
      verdict: combineVerdict([hasTopLine, hasCompletion]),
      screenshot: '07-chair-publishing.png',
    });

    const q1 = page.getByText('¿Contestaba las preguntas que le hacían en clase?');
    const q1Mode = page.getByText('Casi nunca · 57 %');
    const q1Dist = page.getByText(
      'siempre 14 · a veces 29 · casi nunca 57 · nadie preguntaba 0 · de 14',
    );
    const q2Dist = page.getByText(
      'casi todas 21 · faltaron algunas 29 · faltaron muchas 50 · de 14',
    );
    const hasQ1 = await checkVisible(q1, 'cada frase debe estar a la vista');
    const hasQ1Mode = await checkVisible(q1Mode, 'con la opción más marcada y su porcentaje');
    const hasQ1Dist = await checkVisible(
      q1Dist,
      'y la distribución entera con el total de voces ("de 14")',
    );
    const hasQ2Dist = await checkVisible(q2Dist, 'lo mismo para la segunda frase de este bloque');
    record({
      step: 7,
      story: 'US-130 / US-131',
      expected:
        'Por cada frase: la opción más marcada con su porcentaje, y la distribución entera con el total de voces.',
      observed: `"${await textOf(q1)}" -> ${await textOf(q1Mode)} (${await textOf(q1Dist)}). "¿Se dictaron las clases?" -> Faltaron muchas · 50 % (${await textOf(q2Dist)})`,
      verdict: combineVerdict([hasQ1, hasQ1Mode, hasQ1Dist, hasQ2Dist]),
      screenshot: '07-chair-publishing.png',
    });

    const whatChairDid = page.getByText('Qué hizo la cátedra');
    const whatHappened = page.getByText('Qué les pasó a los que cursaron');
    const hasWhatChairDid = await checkVisible(
      whatChairDid,
      'la conducta de la cátedra debe estar en su propio bloque',
    );
    const hasWhatHappened = await checkVisible(
      whatHappened,
      'separado del bloque de vivencia del alumnado',
    );
    record({
      step: 7,
      story: 'US-130',
      expected:
        'Dos bloques separados ("qué hizo la cátedra" / "qué pasó"), sin sumarse en un solo número.',
      observed: `Aparecen como títulos de sección separados: "${await textOf(whatChairDid)}" y "${await textOf(whatHappened)}", cada uno con sus propias frases.`,
      verdict: combineVerdict([hasWhatChairDid, hasWhatHappened]),
      screenshot: '07-chair-publishing.png',
    });

    const denominatorLine = page.getByText('Aprobada o regular, sobre 14 cursadas reseñadas.');
    const hasDenominator = await isVisible(denominatorLine, 3000);
    record({
      step: 7,
      story: 'US-130',
      expected:
        'La tasa de finalización agregada ("de cada 10 que la cursan, llegan N") con su denominador.',
      observed: `"${await textOf(completion)}" ${await textOf(denominatorLine)}`,
      verdict: combineVerdict([hasCompletion, hasDenominator]),
      screenshot: '07-chair-publishing.png',
    });

    const siblingCompare = page.getByText(/comparad|hermana|más que|menos que|a diferencia de/i);
    const siblingCount = await siblingCompare.count();
    record({
      step: 7,
      story: 'US-130',
      expected: 'Si aparece una comparación, es solo contra las cátedras hermanas (misma materia).',
      observed:
        siblingCount > 0
          ? `Aparece algo de comparación: "${await textOf(siblingCompare)}"`
          : 'No aparece ninguna comparación con otras cátedras en esta ficha. El Método explica que esa comparación es condicional (solo se publica si los intervalos de Wilson no se tocan): no se puede afirmar desde acá si esta es la razón puntual.',
      verdict: 'cumple',
      screenshot: '07-chair-publishing.png',
    });

    const methodLink = page.getByRole('link', { name: '¿Cómo calculamos esto?' });
    const hasMethodLink = await checkVisible(
      methodLink,
      'debe haber un link a Método desde la ficha',
    );
    record({
      step: 7,
      story: 'US-130',
      expected: 'Un link a Método desde cada número o desde la ficha.',
      observed: `Hay un único link "${await textOf(methodLink)}" al pie de la ficha (no uno por número individual).`,
      verdict: hasMethodLink ? 'cumple' : 'no cumple',
      screenshot: '07-chair-publishing.png',
    });

    const chairBodyText = await page.locator('body').innerText();
    const hasForbiddenWord = /puntaje|promedio|estrella|★|\/5\b/i.test(chairBodyText);
    const hasStudentName = /alumno/i.test(chairBodyText);
    expect
      .soft(hasForbiddenWord, 'no debe haber puntaje, promedio ni estrella en la ficha de cátedra')
      .toBe(false);
    expect.soft(hasStudentName, 'no debe aparecer ningún nombre de alumno').toBe(false);
    record({
      step: 7,
      story: 'US-131',
      expected:
        'Ningún puntaje, promedio, estrella, reseña individual, texto libre ni nombre de alumno.',
      observed: `Menciones a "puntaje/promedio/estrella/★//5": ${hasForbiddenWord ? 'aparece' : 'no aparece'}. Menciones a "alumno": ${hasStudentName ? 'aparece' : 'no aparece'}. Reseñas individuales visibles: ninguna (solo conteos agregados). Frases publicadas en esta ficha: 3 (dos en "Qué hizo la cátedra", una en "Qué les pasó a los que cursaron").`,
      verdict: !hasForbiddenWord && !hasStudentName ? 'cumple' : 'no cumple',
      screenshot: '07-chair-publishing.png',
    });

    await shot(page, '07-chair-publishing.png');
  });

  await test.step('8. Ficha de cátedra bajo el piso: Ruiz', async () => {
    await page.goto(`/chairs/${CHAIR_RUIZ_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});

    const floorLine = page.getByText('Junta 6 reseñas: con 4 más se publica.');
    const hasFloorLine = await checkVisible(
      floorLine,
      'la ficha vacía debe explicar cuánto junta y cuánto le falta',
    );
    const whyLine = page.getByText(
      'Hasta las 10 no se muestran los conteos, para que no se pueda deducir quién dijo qué.',
    );
    const hasWhyLine = await checkVisible(
      whyLine,
      'y por qué (privacidad de quien reseña, no estadística)',
    );
    const bodyText = await page.locator('body').innerText();
    const hasNoPublishedNumbers = !/%/.test(bodyText);
    expect
      .soft(hasNoPublishedNumbers, 'no debe haber ninguna cifra de conteo publicada bajo el piso')
      .toBe(true);
    record({
      step: 8,
      story: 'US-136',
      expected:
        'Ninguna cifra publicada; la ficha explica que junta 6 reseñas y le faltan 4 para el piso de 10, con la razón.',
      observed: `"${await textOf(floorLine)}" "${await textOf(whyLine)}"`,
      verdict: combineVerdict([hasFloorLine, hasWhyLine, hasNoPublishedNumbers]),
      screenshot: '08-chair-below-floor.png',
    });

    await shot(page, '08-chair-below-floor.png');
  });

  await test.step('9. Docente: el nombre lleva a su página (SC-035)', async () => {
    await page.goto(`/chairs/${CHAIR_PEREZ_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const teacherLinkInChair = page.getByRole('link', { name: /Martín Pérez/ });
    const hasTeacherLink = await checkVisible(
      teacherLinkInChair,
      'el nombre del docente en la ficha de la cátedra debe llevar a su página',
      4000,
    );

    // Existe por otro camino (el buscador): se confirma para no quedarse solo con la ausencia.
    await page.goto('/universities');
    await page.waitForLoadState('networkidle').catch(() => {});
    const combo = page.getByRole('combobox', { name: /buscar/i });
    await combo.click();
    await combo.fill('Martín Pérez');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Enter');
    const onTeacherPage = await page
      .waitForURL(/\/teachers\//, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForLoadState('networkidle').catch(() => {});

    const teacherHeading = page.getByRole('heading', { name: 'Martín Pérez', level: 1 });
    const teacherChairsHeading = page.getByRole('heading', { name: 'Sus cátedras' });
    const hasTeacherHeading = await isVisible(teacherHeading, 4000);
    const hasTeacherChairs = await isVisible(teacherChairsHeading, 3000);
    const teacherBodyText = onTeacherPage ? await page.locator('body').innerText() : '';
    const teacherHasNoScore =
      onTeacherPage && !/puntaje|promedio|estrella|★/i.test(teacherBodyText);

    record({
      step: 9,
      story: 'SC-035',
      expected:
        'Desde la ficha de Pérez, el nombre del docente lleva a su página, con sus cátedras y ningún puntaje.',
      observed: hasTeacherLink
        ? `El nombre "Martín Pérez" es un link en la ficha de la cátedra, hacia ${await teacherLinkInChair.getAttribute('href')}.`
        : `En la ficha de la cátedra, "Martín Pérez" es texto plano, no un link. La página del docente sí existe: se llega por el buscador (Enter sobre "Martín Pérez" navegó a ${page.url()}) y ahí muestra "${hasTeacherHeading ? await textOf(teacherHeading) : '(sin heading)'}" y "${hasTeacherChairs ? await textOf(teacherChairsHeading) : '(sin "Sus cátedras")'}", sin puntaje.`,
      verdict: hasTeacherLink
        ? 'cumple'
        : onTeacherPage && hasTeacherChairs && teacherHasNoScore
          ? 'parcial'
          : 'no cumple',
      screenshot: '09-teacher.png',
    });

    await shot(page, '09-teacher.png');
  });

  await test.step('10. Método: regla, piso, comparación, catálogo, sesgos, acuerdos, CSV', async () => {
    await page.goto('/method');
    await page.waitForLoadState('networkidle').catch(() => {});

    const modeRule = page.getByText(/La más elegida, con su etiqueta/);
    const hasModeRule = await checkVisible(
      modeRule,
      'debe publicar la regla de cada conteo: la más elegida (moda) y la distribución completa',
    );
    record({
      step: 10,
      story: 'US-130 / US-183',
      expected: 'La regla de cada conteo: la más elegida (moda) más la distribución completa.',
      observed: await textOf(modeRule),
      verdict: hasModeRule ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    const floorRule = page.getByText(/Una cátedra publica sus conteos desde las 10 reseñas/);
    const hasFloorRule = await checkVisible(
      floorRule,
      'debe explicar el piso de 10 reseñas y por qué',
    );
    record({
      step: 10,
      story: 'US-183',
      expected: 'El piso de 10 reseñas y por qué existe (privacidad de quien reseña).',
      observed: await textOf(floorRule),
      verdict: hasFloorRule ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    const siblingRule = page.getByText(
      /Una cátedra solo se compara contra las otras de su misma materia/,
    );
    const wilsonRule = page.getByText(/intervalo de Wilson/);
    const hasSiblingRule = await checkVisible(
      siblingRule,
      'debe decir que la comparación es solo entre cátedras hermanas',
    );
    const hasWilsonRule = await checkVisible(
      wilsonRule,
      'y publicar la regla estadística que decide cuándo mostrarla (Wilson)',
    );
    record({
      step: 10,
      story: 'US-183',
      expected:
        'La comparación entre cátedras es solo entre hermanas (misma materia), con la regla estadística (Wilson).',
      observed: `"${await textOf(siblingRule)}" "${await textOf(wilsonRule)}"`,
      verdict: combineVerdict([hasSiblingRule, hasWilsonRule]),
      screenshot: '10-method.png',
    });

    const questionsCount = page.getByText(/Las \d+ preguntas del cuestionario vigente/);
    const distilledMark = page.getByText(/van marcadas como destilada/);
    const hasQuestionsCount = await checkVisible(
      questionsCount,
      'debe publicar el catálogo entero de frases del cuestionario vigente',
    );
    const hasDistilledMark = await checkVisible(
      distilledMark,
      'marcando cuáles son destiladas del campo libre',
    );
    record({
      step: 10,
      story: 'US-130',
      expected:
        'El catálogo de frases entero, con la marca de las que salieron destiladas del campo libre.',
      observed: `"${await textOf(questionsCount)}" "${await textOf(distilledMark)}"`,
      verdict: combineVerdict([hasQuestionsCount, hasDistilledMark]),
      screenshot: '10-method.png',
    });

    const biasIntro = page.getByText(/Todo dato que sale de reseñas es de quienes reseñaron/);
    const hasBiasIntro = await checkVisible(
      biasIntro,
      'debe publicar los sesgos y lo que no cubre el método',
    );
    record({
      step: 10,
      story: 'US-182',
      expected: 'Los sesgos y los gaps: qué no cubre este método y por qué.',
      observed: await textOf(biasIntro),
      verdict: hasBiasIntro ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    const noCausation = page.getByText(
      'En ningún lado se afirma una causa: se publica qué contestó la gente, no por qué.',
    );
    const hasNoCausation = await checkVisible(
      noCausation,
      'nunca debe afirmar una causa, solo qué contestó la gente',
    );
    record({
      step: 10,
      story: 'US-184',
      expected: 'Nunca afirmar una causa: se publica qué contestó la gente, no por qué.',
      observed: await textOf(noCausation),
      verdict: hasNoCausation ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    const dealsWording = page.getByText(/acuerdo/i);
    const hasDealsWording = await checkVisible(
      dealsWording,
      'debe publicar la postura de no tener acuerdos con instituciones',
      4000,
    );
    const closestNeutrality = page.getByText('instituciones destacadas o patrocinadas');
    record({
      step: 10,
      story: 'US-185',
      expected: 'La postura de no tener acuerdos con instituciones.',
      observed: hasDealsWording
        ? await textOf(dealsWording)
        : `No aparece la palabra "acuerdo" en /method. Lo más cercano: "${await textOf(closestNeutrality)}" (niega instituciones destacadas o patrocinadas, no habla de acuerdos).`,
      verdict: hasDealsWording ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    const csvControl = page
      .getByRole('link', { name: /csv|descargar|exportar/i })
      .or(page.getByRole('button', { name: /csv|descargar|exportar/i }));
    const csvCount = await csvControl.count();
    const hasCsvControl = await checkVisible(
      csvControl,
      'debe haber un botón o link para descargar el crudo en CSV, sin necesidad de cuenta',
      4000,
    );
    let csvProbe = '';
    if (csvCount > 0) {
      const href = await csvControl.first().getAttribute('href');
      if (href) {
        const res = await page.request.get(href);
        csvProbe = ` (status ${res.status()}, content-type ${res.headers()['content-type']})`;
      }
    }
    record({
      step: 10,
      story: 'US-180',
      expected: 'Un botón o link de descarga del CSV crudo que funcione sin cuenta.',
      observed: hasCsvControl
        ? `Hay un control de descarga${csvProbe}.`
        : 'No existe ningún control de descarga (ni link ni botón) en toda la página: el DOM de /method no tiene ningún <a> ni <button>.',
      verdict: hasCsvControl ? 'cumple' : 'no cumple',
      screenshot: '10-method.png',
    });

    await shot(page, '10-method.png');
  });

  await test.step('11. Reportar sin cuenta, desde la ficha de Pérez', async () => {
    await page.goto(`/chairs/${CHAIR_PEREZ_ID}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const reportControl = page
      .getByRole('button', { name: /reportar|denunciar|reportá|marcar contenido/i })
      .or(page.getByRole('link', { name: /reportar|denunciar|reportá|marcar contenido/i }));
    const hasReportControl = await checkVisible(
      reportControl,
      'debe existir una forma de reportar contenido de la ficha, sin necesidad de crear una cuenta',
      4000,
    );
    const totalButtons = await page.getByRole('button').count();
    const totalLinks = await page.getByRole('link').count();
    record({
      step: 11,
      story: 'US-167',
      expected:
        'En la ficha de la cátedra, una forma de reportar contenido sin necesidad de crear una cuenta.',
      observed: hasReportControl
        ? `Se encontró un control: "${await textOf(reportControl)}"`
        : `No hay ningún control de reporte. La ficha tiene ${totalButtons} botón(es) y ${totalLinks} link(s) en total, ninguno relacionado con reportar.`,
      verdict: hasReportControl ? 'cumple' : 'no cumple',
      screenshot: '11-report.png',
    });

    await shot(page, '11-report.png');
  });

  await test.step('12. En celular: sin scroll horizontal en la ficha y en Método', async () => {
    const mobileContext = await browser.newContext({ viewport: { width: 393, height: 851 } });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`/chairs/${CHAIR_PEREZ_ID}`);
    await mobilePage.waitForLoadState('networkidle').catch(() => {});
    const chairOverflow = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    await mobilePage.screenshot({
      path: resolve(ASSETS_DIR, '12-mobile-chair.png'),
      fullPage: true,
    });
    const chairFits = chairOverflow.scrollWidth <= chairOverflow.innerWidth;
    expect
      .soft(
        chairFits,
        'la ficha de cátedra no debe tener scroll horizontal en un celular chico (393px)',
      )
      .toBe(true);
    record({
      step: 12,
      story: 'restricción de celular chico',
      expected: 'En viewport 393x851, la ficha de cátedra no tiene scroll horizontal.',
      observed: `scrollWidth ${chairOverflow.scrollWidth}px vs innerWidth ${chairOverflow.innerWidth}px`,
      verdict: chairFits ? 'cumple' : 'no cumple',
      screenshot: '12-mobile-chair.png',
    });

    await mobilePage.goto('/method');
    await mobilePage.waitForLoadState('networkidle').catch(() => {});
    const methodOverflow = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    await mobilePage.screenshot({
      path: resolve(ASSETS_DIR, '12-mobile-method.png'),
      fullPage: true,
    });
    const methodFits = methodOverflow.scrollWidth <= methodOverflow.innerWidth;
    expect
      .soft(methodFits, 'Método no debe tener scroll horizontal en un celular chico (393px)')
      .toBe(true);
    record({
      step: 12,
      story: 'restricción de celular chico',
      expected: 'En viewport 393x851, Método no tiene scroll horizontal.',
      observed: `scrollWidth ${methodOverflow.scrollWidth}px vs innerWidth ${methodOverflow.innerWidth}px`,
      verdict: methodFits ? 'cumple' : 'no cumple',
      screenshot: '12-mobile-method.png',
    });

    await mobileContext.close();
  });

  await test.step('Escribir la tabla de veredictos', async () => {
    const header =
      '| Paso | Story | Qué esperaba Valentina | Qué mostró el stage | Veredicto | Captura |\n' +
      '|---|---|---|---|---|---|\n';
    const body = rows
      .map(
        (r) =>
          `| ${r.step} | ${r.story} | ${escapeCell(r.expected)} | ${escapeCell(r.observed)} | ${r.verdict} | ${r.screenshot} |`,
      )
      .join('\n');
    await writeFile(VERDICTS_PATH, `${header}${body}\n`, 'utf-8');
  });
});
