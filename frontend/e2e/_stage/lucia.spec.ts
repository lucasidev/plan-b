import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { waitForMail } from '../helpers/mailpit';

/**
 * El recorrido de Lucía (docs/product/personas.md) como prueba manual simulada contra el stage
 * real (`https://planb.olisar.com.ar`). A diferencia del recorrido de Valentina (solo lectura),
 * este escribe datos: crea una cuenta nueva y dos o tres reseñas de Fundamentos de Control de
 * Calidad, Cátedra Ruiz. El paso 8 borra la reseña del paso 3, pero la cuenta y la reseña de otro
 * período (paso 6) quedan en el stage al terminar: no hay reset automático.
 *
 * No es E2E de regresión: `playwright.config.ts` la excluye de la suite salvo
 * `PLAYWRIGHT_INCLUDE_STAGE=1` (nunca en CI, mismo mecanismo que `walk.spec.ts` y
 * `valentina.spec.ts`), y corre a mano.
 *
 * Cada paso asierta lo que Lucía espera según su story, con `expect.soft`: si el producto no lo
 * cumple, ese paso queda en rojo y el recorrido sigue igual hasta el final. Además de la
 * aserción, cada paso deja un renglón en `rows` con el texto real leído de la pantalla (no lo que
 * se esperaba), y al final ese registro se vuelca a un archivo Markdown fuera del repo.
 *
 * Arnés resiliente: cada paso corre protegido por `step()` (test.step + try/catch), así uno que
 * explota deja su fila de "no cumple" con el error real y el recorrido sigue con el siguiente en
 * vez de abortarse entero; toda acción (`click`/`fill`/`selectOption`/`goto`) lleva su propio
 * timeout corto, para que ninguna se quede esperando algo que no va a aparecer. La escritura de
 * `VERDICTS_PATH` vive en un `finally` que corre pase lo que pase, así una corrida cortada por
 * `test.setTimeout` deja igual la tabla con los pasos que llegaron a correr.
 *
 * Nivel de confianza de los selectores (2026-09-07, sin STAGE_SEED_PASSWORD ni
 * STAGE_MAILPIT_UI_AUTH en el .env): el paso 1 (la ficha de Ruiz, el gate) y el arranque del paso
 * 2 (Ingresar, Registro) se verificaron en vivo contra el stage con un spec descartable. Todo lo
 * que necesita una cuenta con el mail verificado (el resto del paso 2 en adelante) no se pudo
 * verificar: no hay forma de leer el mail de confirmación sin Mailpit. Esos selectores siguen el
 * patrón ya probado de `walk.spec.ts` (las tres capas de Reseñar) o son mejor esfuerzo.
 *
 * Corre a 300 s (`test.setTimeout`) y sin retries (config global).
 */

const CHAIR_RUIZ_ID = '00000008-0000-4000-a000-000000000003';
const SUBJECT_NAME = 'Fundamentos de Control de Calidad';
const FIRST_TERM_LABEL = '2024-C1';

const STAGE_MAILPIT_URL = process.env.STAGE_MAILPIT_URL ?? 'https://mail.olisar.com.ar';

const ASSETS_DIR = resolve(__dirname, '../../../docs/history/reviews/assets/2026-09-07-lucia');

// Mismo mecanismo que valentina.spec.ts: el destino real de la tabla lo decide quien corre el
// spec (no se commitea un path de máquina local escrito adentro del spec).
const VERDICTS_PATH =
  process.env.LUCIA_VERDICTS_PATH ?? resolve(__dirname, '../../test-results/lucia-verdicts.md');

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
 * espera ausente evita que el recorrido pague 10 s (el default de `expect.timeout`) por cada cosa
 * que ya se sabe que no está.
 */
async function isVisible(locator: Locator, timeoutMs = 5000): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

/** Envuelve `isVisible` con la aserción soft: encodea lo que Lucía espera, no lo que hay. */
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

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** Correlaciona todo lo que esta corrida crea (la cuenta, sus reseñas). */
const RUN_SUFFIX = randomSuffix();

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env: ${hint}`);
  }
  return value;
}

/**
 * La cascada Universidad → Carrera → Plan del `<CareerPicker>` en `/sign-up`. Duplica el helper de
 * `e2e/_stage/walk.spec.ts`: un spec no importa de otro spec.
 */
async function fillCareerCascade(page: Page): Promise<void> {
  await page.getByLabel(/^universidad$/i).waitFor();
  await page
    .getByLabel(/^universidad$/i)
    .selectOption({ label: 'Universidad del Norte Santo Tomás de Aquino' }, { timeout: 15_000 });

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page
    .getByLabel(/^carrera$/i)
    .selectOption(
      { label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software' },
      { timeout: 15_000 },
    );

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerPlanId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page.getByLabel(/plan de estudios/i).selectOption({ index: 1 }, { timeout: 15_000 });
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in', { timeout: 15_000 });
  await page.getByLabel(/tu email/i).fill(email, { timeout: 15_000 });
  await page.getByLabel(/^contraseña$/i).fill(password, { timeout: 15_000 });
  await page.getByRole('button', { name: /^entrar$/i }).click({ timeout: 15_000 });
}

/** Paso 1 de Reseñar: buscar "Fundamentos" y elegir la materia. Deja el período a la vista. */
async function chooseSubject(page: Page): Promise<void> {
  const subjectSearch = page.getByRole('searchbox', { name: /materia/i });
  await subjectSearch.waitFor({ state: 'visible', timeout: 15_000 });
  await subjectSearch.fill('Fundamentos', { timeout: 15_000 });
  const subjectOption = page.getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') });
  await subjectOption.waitFor({ state: 'visible', timeout: 10_000 });
  await subjectOption.click({ timeout: 15_000 });
}

/** Paso 2: elegir el período dado y la Cátedra Ruiz. */
async function chooseTermAndChair(page: Page, termLabel: string): Promise<void> {
  const term = page.getByRole('button', { name: new RegExp(`^${termLabel}$`) });
  await term.waitFor({ state: 'visible', timeout: 15_000 });
  await term.click({ timeout: 15_000 });
  const chair = page.getByRole('button', { name: 'Ruiz', exact: true });
  await chair.waitFor({ state: 'visible', timeout: 15_000 });
  await chair.click({ timeout: 15_000 });
}

async function chooseSubjectTermChair(page: Page, termLabel: string): Promise<void> {
  await chooseSubject(page);
  await chooseTermAndChair(page, termLabel);
}

/** El primer período visible que no esté en `exclude`: para probar la recursada en otro período. */
async function pickUnusedTerm(page: Page, exclude: string[]): Promise<string> {
  const termButtons = page.getByRole('button', { name: /^\d{4}-C\d$/ });
  const count = await termButtons.count();
  for (let i = 0; i < count; i++) {
    const label = (await termButtons.nth(i).textContent())?.trim() ?? '';
    if (label && !exclude.includes(label)) return label;
  }
  throw new Error(`No se encontró un período distinto de: ${exclude.join(', ')}`);
}

/** Lee "Junta N reseñas: con M más se publica." de la ficha de Ruiz. Null si ya publica. */
async function readFloorState(page: Page): Promise<{ count: number; missing: number } | null> {
  const floorLine = page.getByText(/^Junta \d+ reseñas?: con \d+ más se publica\.$/);
  const visible = await isVisible(floorLine, 8000);
  if (!visible) return null;
  const text = (await floorLine.textContent()) ?? '';
  const m = text.match(/Junta (\d+) reseñas?: con (\d+) más se publica\./);
  if (!m) return null;
  return { count: Number(m[1]), missing: Number(m[2]) };
}

/** Fila de un aporte en Mis aportes que contenga todos los textos dados. */
async function findContributionRow(page: Page, mustContain: string[]): Promise<Locator> {
  let row = page.getByRole('listitem');
  for (const text of mustContain) row = row.filter({ hasText: text });
  if ((await row.count()) > 0) return row.first();
  let fallback = page.locator('li, article, [class*="card" i], [class*="row" i]');
  for (const text of mustContain) fallback = fallback.filter({ hasText: text });
  return fallback.first();
}

/** Último paso que arrancó a correr: para la fila de corte si el timeout global mata el test. */
let currentStep = 0;

/**
 * Corre un paso protegido: si algo del contenido explota (típicamente una acción individual que
 * agotó su propio timeout), deja una fila "no cumple" con el error real y el recorrido sigue con
 * el paso siguiente en vez de abortarse entero.
 */
async function step(n: number, title: string, fn: () => Promise<void>): Promise<void> {
  currentStep = n;
  await test.step(`${n}. ${title}`, async () => {
    try {
      await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
      record({
        step: n,
        story: 'arnés',
        expected: `El paso ${n} (${title}) debía completar sus acciones.`,
        observed: `No completó el paso: ${message}`,
        verdict: 'no cumple',
        screenshot: '(sin captura: el paso no llegó a completarse)',
      });
    }
  });
}

async function writeVerdicts(): Promise<void> {
  const header =
    '| Paso | Story | Qué esperaba Lucía | Qué mostró el stage | Veredicto | Captura |\n' +
    '|---|---|---|---|---|---|\n';
  const body = rows
    .map(
      (r) =>
        `| ${r.step} | ${r.story} | ${escapeCell(r.expected)} | ${escapeCell(r.observed)} | ${r.verdict} | ${r.screenshot} |`,
    )
    .join('\n');
  await writeFile(VERDICTS_PATH, `${header}${body}\n`, 'utf-8');
}

let mailpitAuth: string;

test.beforeAll(async () => {
  mailpitAuth = requireEnv(
    'STAGE_MAILPIT_UI_AUTH',
    'usuario:password de la UI de Mailpit del stage (el mismo valor que MAILPIT_UI_AUTH en Dokploy).',
  );
  requireEnv(
    'STAGE_SEED_PASSWORD',
    'la password con la que el stage sembró admin@planb.local y el resto de las personas (este recorrido no loguea ninguna cuenta sembrada, pero completa el mismo contrato de credenciales que el resto de _stage/).',
  );
  await mkdir(ASSETS_DIR, { recursive: true });
});

test('Lucía crea la cuenta en la acción, reseña en dos minutos y deshace lo que dijo', async ({
  page,
}) => {
  test.setTimeout(300_000);

  const email = `lucia+${RUN_SUFFIX.toLowerCase()}@planb.local`;
  const password = 'stage-lucia-pw-1234';

  let reviewCountBefore = 0;
  let missingBefore = 0;
  let baselineKnown = false;
  let secondTermLabel = '';
  let thirdTermLabel = '';

  try {
    await step(1, 'El gate llega en la acción, no en la puerta', async () => {
      await page.goto(`/chairs/${CHAIR_RUIZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const floor = await readFloorState(page);
      if (floor) {
        reviewCountBefore = floor.count;
        missingBefore = floor.missing;
        baselineKnown = true;
      }

      const reviewCta = page.getByRole('link', { name: /reseñala/i });
      const hasCta = await checkVisible(
        reviewCta,
        'sin cuenta, debe existir un camino para reseñar esta cátedra desde su propia ficha',
      );
      await shot(page, '01-chair-before-account.png');

      let wentToSignIn = false;
      if (hasCta) {
        await reviewCta.click({ timeout: 15_000 });
        wentToSignIn = await page
          .waitForURL(/\/sign-in/, { timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      const gateUrl = page.url();

      const reasonText = page.getByText(/necesit.s una cuenta/i);
      const hasReason = await isVisible(reasonText, 4000);
      await shot(page, '01-sign-in-gate.png');

      record({
        step: 1,
        story: 'US-168 / US-170 / US-229',
        expected:
          'Sin cuenta, clickear "¿La cursaste? Reseñala" en la ficha de Ruiz recién ahí pide cuenta, con el motivo a la vista ("para reseñar necesitás una cuenta"), nunca antes de leer.',
        observed: `${hasCta ? `Clickeó el CTA y quedó en ${gateUrl}.` : 'No encontró el CTA "Reseñala" en la ficha.'} ${
          hasReason
            ? `Motivo mostrado: "${await textOf(reasonText)}"`
            : 'No se encontró ningún texto con "necesitás una cuenta" en la pantalla de Ingresar.'
        } Estado de Ruiz antes de reseñar: ${
          baselineKnown
            ? `Junta ${reviewCountBefore} reseñas, con ${missingBefore} más se publica.`
            : 'ya publica (no se leyó el estado bajo el piso).'
        }`,
        verdict: combineVerdict([hasCta, wentToSignIn, hasReason]),
        screenshot: '01-sign-in-gate.png',
      });
    });

    await step(2, 'Crear la cuenta con lo mínimo', async () => {
      if (!/\/sign-in/.test(page.url())) await page.goto('/sign-in', { timeout: 15_000 });

      // Texto real verificado en vivo contra el stage (2026-09-07): "Creá tu cuenta", no
      // "¿no tenés cuenta?" como dice la ficha de la pantalla (SC-025).
      const noAccountLink = page.getByRole('link', { name: /cre. tu cuenta/i });
      const hasNoAccountLink = await checkVisible(
        noAccountLink,
        'desde Ingresar debe haber un link a Registro para quien no tiene cuenta',
        4000,
      );
      if (hasNoAccountLink) {
        await noAccountLink.click({ timeout: 15_000 });
        await page.waitForURL(/\/sign-up/, { timeout: 10_000 }).catch(() => {});
      } else {
        await page.goto('/sign-up', { timeout: 15_000 });
      }
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '02-sign-up-form.png');

      const emailField = page.getByLabel(/tu email/i);
      const hasEmailField = await checkVisible(emailField, 'el registro debe pedir mail');
      if (hasEmailField) await emailField.fill(email, { timeout: 15_000 });

      const passwordField = page.getByLabel(/^contraseña$/i);
      const hasPasswordField = await checkVisible(
        passwordField,
        'el registro debe pedir contraseña',
      );
      if (hasPasswordField) await passwordField.fill(password, { timeout: 15_000 });

      const repeatField = page.getByLabel(/repetí la contraseña/i);
      const hasRepeatField = await checkVisible(
        repeatField,
        'el registro debe pedir repetir la contraseña',
      );
      if (hasRepeatField) await repeatField.fill(password, { timeout: 15_000 });

      const situationField = page
        .getByText(/curso o doy clases|soy estudiante|soy docente|curso o curs/i)
        .or(page.getByRole('radiogroup'));
      const hasSituationField = await isVisible(situationField, 3000);

      const consentField = page
        .getByRole('checkbox')
        .or(page.getByText(/consentimiento|aviso de privacidad|ley 25\.326/i));
      const hasConsentField = await isVisible(consentField, 3000);

      const universityField = page.getByLabel(/^universidad$/i);
      const hasUniversityField = await isVisible(universityField, 5000);
      if (hasUniversityField) await fillCareerCascade(page);
      await shot(page, '02-sign-up-filled.png');

      record({
        step: 2,
        story: 'US-228',
        expected:
          'Mail, contraseña, si cursa o da clases, la carrera (UNSTA / Tecnicatura Universitaria en Desarrollo y Calidad de Software) y el consentimiento informado a la vista antes de mandar.',
        observed: `Campos presentes: mail (${hasEmailField ? 'sí' : 'no'}), contraseña (${hasPasswordField ? 'sí' : 'no'}), repetir contraseña (${hasRepeatField ? 'sí' : 'no'}), universidad/carrera/plan (${hasUniversityField ? 'sí' : 'no'}). Campos que la story pide y no aparecieron: "si cursa o da clases" (${hasSituationField ? 'sí aparece' : 'no aparece'}), consentimiento informado (${hasConsentField ? 'sí aparece' : 'no aparece'}).`,
        verdict: combineVerdict([
          hasEmailField,
          hasPasswordField,
          hasRepeatField,
          hasUniversityField,
          hasSituationField,
          hasConsentField,
        ]),
        screenshot: '02-sign-up-filled.png',
      });

      const submitButton = page.getByRole('button', { name: /crear mi cuenta/i });
      const hasSubmit = await checkVisible(
        submitButton,
        'debe haber un botón para crear la cuenta',
      );
      let wentToCheckInbox = false;
      if (hasSubmit) {
        await submitButton.click({ timeout: 15_000 });
        wentToCheckInbox = await page
          .waitForURL(/\/sign-up\/check-inbox/, { timeout: 20_000 })
          .then(() => true)
          .catch(() => false);
      }
      await shot(page, '02-check-inbox.png');

      record({
        step: 2,
        story: 'US-228',
        expected:
          'Al mandar el formulario, la pantalla dice "te mandamos un mail" y no confirma la cuenta todavía.',
        observed: wentToCheckInbox
          ? `Quedó en ${page.url()}`
          : `No llegó a check-inbox; quedó en ${page.url()}.`,
        verdict: wentToCheckInbox ? 'cumple' : 'no cumple',
        screenshot: '02-check-inbox.png',
      });

      const mail = await waitForMail(email, 20_000, {
        baseUrl: STAGE_MAILPIT_URL,
        auth: mailpitAuth,
      });
      const tokenMatch = mail.HTML.match(/[?&]token=([A-Za-z0-9_-]+)/);
      record({
        step: 2,
        story: 'US-228',
        expected: 'Llega un mail real a la casilla, con un link de verificación (?token=).',
        observed: `Asunto: "${mail.Subject}". ${tokenMatch ? 'Trae un token de verificación.' : 'No se encontró ningún ?token= en el mail.'}`,
        verdict: tokenMatch ? 'cumple' : 'no cumple',
        screenshot: '02-check-inbox.png',
      });

      if (tokenMatch) {
        await page.goto(`/verify-email?token=${tokenMatch[1]}`, { timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      await shot(page, '02-verified.png');

      await signIn(page, email, password);
      const signedIn = await page
        .waitForURL(/\/(home|reviews\/new)/, { timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '02-landed-after-sign-in.png');

      const landedOnReview = /\/reviews\/new/.test(page.url());
      record({
        step: 2,
        story: 'US-229',
        expected:
          'Al entrar después de verificar el mail, vuelve exactamente a lo que estaba haciendo (reseñar Fundamentos de Control de Calidad, Cátedra Ruiz), no a un lugar por defecto.',
        observed: signedIn
          ? `Quedó logueada en ${page.url()}. ${landedOnReview ? 'Volvió al flujo de reseñar.' : 'No volvió a Reseñar: fue a un destino por defecto.'}`
          : `No pudo entrar: quedó en ${page.url()}.`,
        verdict: landedOnReview ? 'cumple' : 'no cumple',
        screenshot: '02-landed-after-sign-in.png',
      });
    });

    await step(3, 'Reseñar una materia sola en menos de dos minutos', async () => {
      const startedAt = Date.now();
      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '03-review-form.png');

      await chooseSubjectTermChair(page, FIRST_TERM_LABEL);

      const outcomePatterns: Array<[string, RegExp]> = [
        ['La aprobé', /^La aprob.$/],
        ['Me quedó regular', /^Me qued. regular$/],
        ['La recursé', /^La recurs.$/],
        ['La dejé', /^La dej.$/],
      ];
      const outcomeVisibility = await Promise.all(
        outcomePatterns.map(([, pattern]) =>
          isVisible(page.getByRole('button', { name: pattern }), 8000),
        ),
      );
      const outcomeButton = page.getByRole('button', { name: /^La aprob.$/ });
      if (await isVisible(outcomeButton, 5000)) await outcomeButton.click({ timeout: 15_000 });

      record({
        step: 3,
        story: 'US-147 / US-154',
        expected:
          'El paso 1 arranca eligiendo una sola materia (sin checklist del período), y "cómo terminó" es un toque entre cuatro: la aprobé, me quedó regular, la recursé, la dejé.',
        observed: `Encontró y eligió "${SUBJECT_NAME}" con un buscador de una sola materia, período ${FIRST_TERM_LABEL}, Cátedra Ruiz. Opciones de "cómo terminó" visibles: ${outcomePatterns.map(([label], i) => `${label}=${outcomeVisibility[i] ? 'sí' : 'no'}`).join(', ')}. Tocó "La aprobé".`,
        verdict: combineVerdict(outcomeVisibility),
        screenshot: '03-review-form.png',
      });

      // Paso 4 (qué hizo la cátedra) se saltea entero. Paso 5 (qué te pasó a vos): una sola frase,
      // "Con esfuerzo" (única en el catálogo de phrases.md, sin ambigüedad con otra opción).
      const oneAnswer = page.getByRole('button', { name: 'Con esfuerzo', exact: true });
      const hasOneAnswer = await checkVisible(
        oneAnswer,
        'debe poder responder una sola frase del paso 5 y dejar el resto sin contestar',
      );
      if (hasOneAnswer) await oneAnswer.click({ timeout: 15_000 });
      await shot(page, '03-review-answered.png');

      record({
        step: 3,
        story: 'US-146',
        expected:
          'Responder una sola frase (o ninguna) alcanza: saltear el resto no bloquea el envío.',
        observed: hasOneAnswer
          ? 'Encontró "Con esfuerzo" (paso 5, ¿Pudiste seguir el ritmo?) y la tocó; dejó todo el paso 4 y el resto del paso 5 sin contestar.'
          : 'No encontró la opción "Con esfuerzo" para responder una sola frase.',
        verdict: hasOneAnswer ? 'cumple' : 'no cumple',
        screenshot: '03-review-answered.png',
      });

      const freeTextField = page.getByLabel(/algo que no te preguntamos/i);
      const hasFreeText = await checkVisible(
        freeTextField,
        'el paso 6 debe ofrecer un campo libre opcional que avise que no se publica',
      );
      const freeTextNote = page.getByText(/no se publica/i);
      const hasFreeTextNote = await isVisible(freeTextNote, 3000);

      const contractSum = page.getByText(/se suma.? al total/i);
      const contractNoIndividual = page.getByText(/ninguna rese.a individual|nunca se muestra/i);
      const contractFloor = page.getByText(
        /junta \d+ rese.as?: con \d+ m.s se publica|ya publica/i,
      );
      const hasContractSum = await isVisible(contractSum, 3000);
      const hasContractNoIndividual = await isVisible(contractNoIndividual, 3000);
      const hasContractFloor = await isVisible(contractFloor, 3000);
      await shot(page, '03-review-contract.png');

      record({
        step: 3,
        story: 'US-159',
        expected:
          'Antes de enviar, el contrato completo: las respuestas se suman al total, ninguna reseña individual se muestra jamás, y el estado del piso de esa cátedra.',
        observed: `Campo libre: ${hasFreeText ? 'presente' : 'ausente'} (nota "no se publica": ${hasFreeTextNote ? 'sí' : 'no'}). Contrato: "se suma al total" ${hasContractSum ? 'sí' : 'no'}; "ninguna individual" ${hasContractNoIndividual ? 'sí' : 'no'}; estado del piso ${hasContractFloor ? `sí: "${await textOf(contractFloor)}"` : 'no'}.`,
        verdict: combineVerdict([
          hasFreeText,
          hasFreeTextNote,
          hasContractSum,
          hasContractNoIndividual,
          hasContractFloor,
        ]),
        screenshot: '03-review-contract.png',
      });

      const submitButton = page.getByRole('button', { name: /enviar la rese.a/i });
      const hasSubmit = await checkVisible(
        submitButton,
        'debe haber un único botón para enviar la reseña',
      );
      let submitted = false;
      if (hasSubmit) {
        await submitButton.click({ timeout: 15_000 });
        submitted = await page
          .waitForURL(/\/reviews\/mine/, { timeout: 30_000 })
          .then(() => true)
          .catch(() => false);
      }
      const elapsedMs = Date.now() - startedAt;
      await shot(page, '03-review-submitted.png');

      record({
        step: 3,
        story: 'US-146',
        expected:
          'De abrir /reviews/new a que la reseña quede enviada pasan menos de 120 segundos, con respuestas rápidas.',
        observed: `${submitted ? `Envió y quedó en ${page.url()}` : `No confirmó el envío; quedó en ${page.url()}`}. Tiempo total: ${(elapsedMs / 1000).toFixed(1)} s.`,
        verdict: submitted && elapsedMs < 120_000 ? 'cumple' : 'no cumple',
        screenshot: '03-review-submitted.png',
      });
    });

    await step(4, 'Ver que contó', async () => {
      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '04-my-contributions.png');

      const contributionRow = await findContributionRow(page, [SUBJECT_NAME, FIRST_TERM_LABEL]);
      const hasRow = await checkVisible(
        contributionRow,
        'Mis aportes debe mostrar la reseña recién enviada, con la materia y el período',
      );
      const rowText = hasRow ? ((await contributionRow.textContent()) ?? '').trim() : '';
      const showsVoicesForAnswer = /\d+ de \d+ voces/i.test(rowText);

      record({
        step: 4,
        story: 'US-162',
        expected:
          'Mis aportes muestra, por cada frase que respondiste, la opción elegida y las voces que suma ahora esa opción.',
        observed: hasRow
          ? `Fila encontrada: "${rowText.slice(0, 300)}"`
          : 'No se encontró ninguna fila para esta reseña.',
        verdict: hasRow && showsVoicesForAnswer ? 'cumple' : hasRow ? 'parcial' : 'no cumple',
        screenshot: '04-my-contributions.png',
      });

      await page.goto('/home', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '04-home.png');

      const chairRow = page.getByText(/ruiz/i);
      const hasChairRow = await checkVisible(
        chairRow,
        'Inicio debe mostrar la cátedra que reseñó, con sus voces y si publica o cuánto le falta',
      );
      const coverageText = page.getByText(/\d+ de \d+ materias/i);
      const hasCoverage = await isVisible(coverageText, 5000);

      record({
        step: 4,
        story: 'US-231',
        expected:
          'Inicio muestra las cátedras reseñadas (voces, si publica o cuánto le falta) y cuántas materias de la carrera están medidas.',
        observed: `${hasChairRow ? 'Fila de Ruiz encontrada.' : 'No se encontró ninguna fila de la Cátedra Ruiz en Inicio.'} Cobertura: ${hasCoverage ? await textOf(coverageText) : 'no se encontró ninguna línea de cobertura.'}`,
        verdict: combineVerdict([hasChairRow, hasCoverage]),
        screenshot: '04-home.png',
      });

      await page.goto(`/chairs/${CHAIR_RUIZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '04-chair-after-review.png');

      const floorAfter = await readFloorState(page);
      const expectedCount = reviewCountBefore + 1;
      const expectedMissing = Math.max(missingBefore - 1, 0);
      const matches =
        baselineKnown && floorAfter
          ? floorAfter.count === expectedCount && floorAfter.missing === expectedMissing
          : false;

      record({
        step: 4,
        story: 'US-231 / US-159',
        expected: baselineKnown
          ? `El conteo de Ruiz sube una unidad respecto de antes de reseñar (de "Junta ${reviewCountBefore}, con ${missingBefore} más se publica" a "Junta ${expectedCount}, con ${expectedMissing} más se publica").`
          : 'El conteo de Ruiz sube una unidad respecto de antes de reseñar (no se pudo leer el estado bajo el piso en el paso 1).',
        observed: floorAfter
          ? `Ahora dice: Junta ${floorAfter.count} reseñas, con ${floorAfter.missing} más se publica.`
          : 'La ficha ya no muestra el estado bajo el piso (puede haber cruzado a publicar).',
        verdict: baselineKnown ? (matches ? 'cumple' : 'no cumple') : 'parcial',
        screenshot: '04-chair-after-review.png',
      });
    });

    await step(5, 'Editar', async () => {
      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const row = await findContributionRow(page, [SUBJECT_NAME, FIRST_TERM_LABEL]);
      const editControl = row
        .getByRole('link', { name: /^editar$/i })
        .or(row.getByRole('button', { name: /^editar$/i }));
      const hasEdit = await checkVisible(
        editControl,
        'cada aporte debe tener su propio control de Editar',
      );
      if (hasEdit) {
        await editControl.first().click({ timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      await shot(page, '05-edit-review.png');

      const newOutcome = page.getByRole('button', { name: /^Me qued. regular$/ });
      const hasOutcomeControl = await checkVisible(
        newOutcome,
        'debe poder cambiar "cómo terminó" de a una respuesta, sin tocar el resto de la reseña',
      );
      if (hasOutcomeControl) await newOutcome.click({ timeout: 15_000 });

      const saveButton = page.getByRole('button', { name: /guardar/i });
      const hasSaveButton = await isVisible(saveButton, 4000);
      if (hasSaveButton) {
        await saveButton.click({ timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      await shot(page, '05-edit-saved.png');

      record({
        step: 5,
        story: 'US-165',
        expected:
          'Desde Mis aportes se puede editar la reseña entera o una respuesta de a una (por ejemplo "cómo terminó"), y el cambio se refleja al instante.',
        observed: `${hasEdit ? 'Encontró el control Editar en la fila del aporte.' : 'No encontró un control de Editar en la fila.'} ${hasOutcomeControl ? 'Cambió "cómo terminó" a "Me quedó regular".' : 'No encontró el control para cambiar "cómo terminó".'} ${hasSaveButton ? 'Guardó el cambio.' : 'No encontró un botón para guardar.'}`,
        verdict: combineVerdict([hasEdit, hasOutcomeControl, hasSaveButton]),
        screenshot: '05-edit-saved.png',
      });
    });

    await step(6, 'Reseñar la misma materia dos veces', async () => {
      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await chooseSubjectTermChair(page, FIRST_TERM_LABEL);

      // Completa la segunda reseña igual que la primera (cómo terminó + una frase): un botón
      // deshabilitado por campos obligatorios sin completar no prueba nada sobre el bloqueo de
      // duplicados, solo que el formulario está vacío.
      const outcomeButton = page.getByRole('button', { name: /^La aprob.$/ });
      if (await isVisible(outcomeButton, 5000)) await outcomeButton.click({ timeout: 15_000 });
      const oneAnswer = page.getByRole('button', { name: 'Con esfuerzo', exact: true });
      if (await isVisible(oneAnswer, 5000)) await oneAnswer.click({ timeout: 15_000 });

      const blockedInline = page.getByText(/ya rese.aste|ya la rese.aste|ya rese.ada/i);
      const hasInlineBlock = await isVisible(blockedInline, 5000);

      const submitButton = page.getByRole('button', { name: /enviar la rese.a/i });
      const submitVisible = await isVisible(submitButton, 5000);
      const submitDisabled =
        submitVisible && !(await submitButton.isEnabled({ timeout: 5000 }).catch(() => true));

      if (!hasInlineBlock && submitVisible && !submitDisabled) {
        await submitButton.click({ timeout: 15_000 }).catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      await shot(page, '06-duplicate-same-term.png');

      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const rowsForFirstTerm = page
        .getByRole('listitem')
        .filter({ hasText: SUBJECT_NAME })
        .filter({ hasText: FIRST_TERM_LABEL });
      const countForFirstTerm = await rowsForFirstTerm.count();
      const stillOnlyOne = countForFirstTerm <= 1;

      record({
        step: 6,
        story: 'US-163',
        expected: `Reseñar de nuevo la misma materia y cátedra en el mismo período (${FIRST_TERM_LABEL}), con la reseña completa (cómo terminó + una frase), no cuenta dos veces: rechazo o aviso, nunca una segunda fila.`,
        observed: hasInlineBlock
          ? `Con la reseña completa, un aviso lo frenó antes de enviar: "${await textOf(blockedInline)}".`
          : submitDisabled
            ? 'Con "cómo terminó" y una frase completas, el botón "Enviar la reseña" siguió deshabilitado, sin ningún aviso de texto visible.'
            : `No hubo aviso inline ni botón deshabilitado con la reseña completa; ${countForFirstTerm} fila(s) de "${SUBJECT_NAME}" en ${FIRST_TERM_LABEL} en Mis aportes.`,
        verdict: hasInlineBlock || submitDisabled || stillOnlyOne ? 'cumple' : 'no cumple',
        screenshot: '06-duplicate-same-term.png',
      });

      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await chooseSubject(page);
      secondTermLabel = await pickUnusedTerm(page, [FIRST_TERM_LABEL]);
      await chooseTermAndChair(page, secondTermLabel);
      const secondOutcome = page.getByRole('button', { name: /^La aprob.$/ });
      if (await isVisible(secondOutcome, 5000)) await secondOutcome.click({ timeout: 15_000 });
      const secondAnswer = page.getByRole('button', { name: 'Con esfuerzo', exact: true });
      if (await isVisible(secondAnswer, 5000)) await secondAnswer.click({ timeout: 15_000 });
      const submitButton2 = page.getByRole('button', { name: /enviar la rese.a/i });
      let submitted2 = false;
      if (await isVisible(submitButton2, 5000)) {
        await submitButton2.click({ timeout: 15_000 });
        submitted2 = await page
          .waitForURL(/\/reviews\/mine/, { timeout: 30_000 })
          .then(() => true)
          .catch(() => false);
      }
      await shot(page, '06-second-term-review.png');

      record({
        step: 6,
        story: 'US-163',
        expected: `Reseñar la misma materia y cátedra en otro período (${secondTermLabel || 'sin identificar'}) sí vale, como otra cursada independiente.`,
        observed: submitted2
          ? `Se envió y quedó en ${page.url()}.`
          : `No se confirmó el envío; quedó en ${page.url()}.`,
        verdict: submitted2 ? 'cumple' : 'no cumple',
        screenshot: '06-second-term-review.png',
      });
    });

    await step(7, 'Retomar a medias', async () => {
      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await chooseSubject(page);
      thirdTermLabel = await pickUnusedTerm(page, [FIRST_TERM_LABEL, secondTermLabel]).catch(
        () => '',
      );
      if (thirdTermLabel) await chooseTermAndChair(page, thirdTermLabel);

      const outcomeButton = page.getByRole('button', { name: /^La aprob.$/ });
      if (await isVisible(outcomeButton, 5000)) await outcomeButton.click({ timeout: 15_000 });
      const partialAnswer = page.getByRole('button', { name: 'Con esfuerzo', exact: true });
      if (await isVisible(partialAnswer, 5000)) await partialAnswer.click({ timeout: 15_000 });
      await shot(page, '07-draft-before-leaving.png');

      await page.goto('/home', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '07-resume-draft.png');

      const searchBoxStillEmpty = await isVisible(
        page.getByRole('searchbox', { name: /materia/i }),
        3000,
      );
      const subjectAlreadyChosen = await isVisible(page.getByText(SUBJECT_NAME), 3000);
      const draftResumedOnPage = subjectAlreadyChosen && !searchBoxStillEmpty;

      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const draftRow = page.getByText(/a medias/i);
      const draftInMyContributions = await isVisible(draftRow, 5000);
      await shot(page, '07-resume-my-contributions.png');

      record({
        step: 7,
        story: 'US-161',
        expected:
          'Cerrar la pestaña a medias (dos frases contestadas) y volver hace que lo contestado reaparezca para retomar, en /reviews/new o en Mis aportes.',
        observed: `${draftResumedOnPage ? 'Al volver a /reviews/new, lo elegido seguía ahí (sin buscador vacío de nuevo).' : 'Al volver a /reviews/new, no encontró señales de que lo contestado haya sobrevivido: apareció el buscador de materia vacío otra vez.'} ${draftInMyContributions ? 'En Mis aportes aparece un aporte "a medias".' : 'En Mis aportes no aparece ningún aporte "a medias".'}`,
        verdict: combineVerdict([draftResumedOnPage, draftInMyContributions]),
        screenshot: '07-resume-draft.png',
      });
    });

    await step(8, 'Borrar', async () => {
      await page.goto(`/chairs/${CHAIR_RUIZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const floorBeforeDelete = await readFloorState(page);

      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const row = await findContributionRow(page, [SUBJECT_NAME, FIRST_TERM_LABEL]);
      const deleteControl = row
        .getByRole('link', { name: /^borrar$/i })
        .or(row.getByRole('button', { name: /^borrar$/i }));
      const hasDeleteControl = await checkVisible(
        deleteControl,
        'cada aporte debe tener su propio control de Borrar',
      );
      if (hasDeleteControl) await deleteControl.first().click({ timeout: 15_000 });

      const confirmText = page.getByText(/no se puede deshacer/i);
      const hasConfirmText = await isVisible(confirmText, 5000);
      await shot(page, '08-delete-confirm.png');

      const confirmButton = page.getByRole('button', { name: /^borrar$/i }).last();
      if (await isVisible(confirmButton, 3000)) {
        await confirmButton.click({ timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }

      record({
        step: 8,
        story: 'US-165',
        expected:
          'Borrar un aporte pide una confirmación aparte, explícita ("esto no se puede deshacer"), antes de sacarlo.',
        observed: hasConfirmText
          ? `Mostró: "${await textOf(confirmText)}"`
          : 'No se encontró un texto que avise que borrar no se puede deshacer.',
        verdict: hasDeleteControl && hasConfirmText ? 'cumple' : 'no cumple',
        screenshot: '08-delete-confirm.png',
      });

      await page.goto(`/chairs/${CHAIR_RUIZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const floorAfterDelete = await readFloorState(page);
      await shot(page, '08-chair-after-delete.png');

      const decreasedByOne = Boolean(
        floorBeforeDelete &&
          floorAfterDelete &&
          floorAfterDelete.count === floorBeforeDelete.count - 1,
      );

      record({
        step: 8,
        story: 'US-165 / US-231',
        expected:
          'Al borrar la reseña del paso 3, la ficha de Ruiz vuelve al conteo anterior: una menos que justo antes de borrar.',
        observed: `Antes de borrar: ${floorBeforeDelete ? `Junta ${floorBeforeDelete.count} reseñas, con ${floorBeforeDelete.missing} más se publica.` : 'ya publicaba.'} Después: ${floorAfterDelete ? `Junta ${floorAfterDelete.count} reseñas, con ${floorAfterDelete.missing} más se publica.` : 'ya publica.'}`,
        verdict: decreasedByOne ? 'cumple' : 'no cumple',
        screenshot: '08-chair-after-delete.png',
      });
    });

    await step(9, 'Cerrar sesión', async () => {
      await page.goto('/home', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const accountMenuTrigger = page.getByRole('button', {
        name: /mi cuenta|tu cuenta|cerrar sesión/i,
      });
      const hasMenuTrigger = await isVisible(accountMenuTrigger, 5000);

      let signedOutViaUi = false;
      if (hasMenuTrigger) {
        await accountMenuTrigger.first().click({ timeout: 15_000 });
        await page.waitForTimeout(500);
        if (/\/sign-in/.test(page.url())) {
          signedOutViaUi = true;
        } else {
          const signOutItem = page
            .getByRole('menuitem', { name: /cerrar sesión/i })
            .or(page.getByRole('button', { name: /cerrar sesión/i }));
          if (await isVisible(signOutItem, 4000)) {
            await signOutItem.first().click({ timeout: 15_000 });
            signedOutViaUi = true;
          }
        }
      }
      if (!signedOutViaUi) await page.context().clearCookies();
      await page.waitForLoadState('networkidle').catch(() => {});

      await page.goto(`/chairs/${CHAIR_RUIZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '09-signed-out-chair.png');

      const chairHeading = page.getByRole('heading', { level: 1 });
      const stillReadable = await checkVisible(
        chairHeading,
        'la ficha de Ruiz debe seguir leyéndose sin cuenta después de cerrar sesión',
      );
      const signInLink = page.getByRole('link', { name: /^ingresar$/i });
      const showsSignedOut = await isVisible(signInLink, 4000);

      record({
        step: 9,
        story: 'US-168',
        expected: 'Después de cerrar sesión, la ficha de Ruiz se sigue leyendo sin cuenta.',
        observed: `${signedOutViaUi ? 'Cerró sesión desde el menú de cuenta.' : 'No encontró el control de cerrar sesión en la UI; se forzó borrando las cookies para poder seguir probando la lectura anónima.'} La ficha ${stillReadable ? 'se leyó igual' : 'no se pudo leer'}. ${showsSignedOut ? 'Vuelve a mostrar "Ingresar".' : 'No se encontró el link "Ingresar".'}`,
        verdict: combineVerdict([stillReadable, showsSignedOut]),
        screenshot: '09-signed-out-chair.png',
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
    record({
      step: currentStep,
      story: 'arnés',
      expected: 'El recorrido debía completar sus pasos dentro del timeout.',
      observed: `CORTADO en el paso ${currentStep}: ${message}`,
      verdict: 'no cumple',
      screenshot: '(sin captura: el recorrido se cortó acá)',
    });
  } finally {
    await writeVerdicts();
  }
});
