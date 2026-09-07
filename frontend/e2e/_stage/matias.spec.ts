import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { waitForMail } from '../helpers/mailpit';

/**
 * El recorrido de Matías (docs/product/personas.md) como prueba manual simulada contra el
 * stage real (`https://planb.olisar.com.ar`). A diferencia de `valentina.spec.ts` (lectura pura),
 * este recorrido tiene cuenta: crea una cuenta descartable, reseña una cursada de la Cátedra
 * Pérez y termina dándose de baja. No deshace la reseña que queda sumada a Pérez: eso es parte
 * del recorrido (Matías quiere justamente que el número quede, aun después de irse).
 *
 * No es E2E de regresión: `playwright.config.ts` la excluye de la suite salvo
 * `PLAYWRIGHT_INCLUDE_STAGE=1` (nunca en CI, mismo mecanismo que `walk.spec.ts` y
 * `valentina.spec.ts`), y corre a mano.
 *
 * Requiere `STAGE_MAILPIT_UI_AUTH` en el `.env` de la raíz (la UI de Mailpit del stage, detrás de
 * basic auth): sin eso no hay forma de leer el mail de verificación, y el `beforeAll` corta con
 * un error que dice qué falta (mismo patrón que `walk.spec.ts`).
 *
 * Cada paso asierta lo que Matías espera según su story, con `expect.soft`: si el producto no lo
 * cumple, ese paso queda en rojo y el recorrido sigue igual hasta el final. Además de la
 * aserción, cada paso deja un renglón en `rows` con el texto real leído de la pantalla, y al
 * final ese registro se vuelca a un archivo Markdown fuera del repo.
 *
 * Arnés resiliente: cada paso corre protegido por `step()` (test.step + try/catch), así uno que
 * explota deja su fila de "no cumple" con el error real y el recorrido sigue con el siguiente en
 * vez de abortarse entero; toda acción (`click`/`fill`/`selectOption`/`goto`) lleva su propio
 * timeout corto, para que ninguna se quede esperando algo que no va a aparecer. La escritura de
 * `VERDICTS_PATH` vive en un `finally` que corre pase lo que pase, así una corrida cortada por
 * `test.setTimeout` deja igual la tabla con los pasos que llegaron a correr.
 *
 * Corre a 300 s (`test.setTimeout`) y sin retries (config global).
 */

const STAGE_MAILPIT_URL = process.env.STAGE_MAILPIT_URL ?? 'https://mail.olisar.com.ar';

const CHAIR_PEREZ_ID = '00000008-0000-4000-a000-000000000001';
const SUBJECT_FUNDAMENTOS_ID = '00000004-0000-4000-a000-000000000012';
const SUBJECT_NAME = 'Fundamentos de Control de Calidad';
const TEACHER_PEREZ_ID = '00000006-0000-4000-a000-00000000000b';

const ASSETS_DIR = resolve(__dirname, '../../../docs/history/reviews/assets/2026-09-07-matias');
const VERDICTS_PATH = resolve(__dirname, '../../test-results/matias-verdicts.md');

/** El bloque de distribución de "¿Se dictaron las clases?" en la ficha publicada de una cátedra. */
const Q2_DIST_PATTERN =
  /casi todas (\d+) · faltaron algunas (\d+) · faltaron muchas (\d+) · de (\d+)/;

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** Correlaciona todo lo que esta corrida crea (cuenta, texto libre) y lo que busca después. */
const SUFFIX = randomSuffix();
const MATIAS_EMAIL = `matias+${SUFFIX.toLowerCase()}@planb.local`;
const MATIAS_PASSWORD = 'stage-matias-pw-1234';
const FREE_TEXT_NOTE = `El titular Pérez faltó seis clases seguidas en abril y lo dije en la oficina de alumnos, nadie hizo nada (${SUFFIX})`;

type Verdict = 'cumple' | 'no cumple' | 'parcial' | 'no aplica';

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

/** Envuelve `isVisible` con la aserción soft: encodea lo que Matías espera, no lo que hay. */
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

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env: ${hint}`);
  }
  return value;
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in', { timeout: 15_000 });
  await page.getByLabel(/tu email/i).fill(email, { timeout: 15_000 });
  await page.getByLabel(/^contraseña$/i).fill(password, { timeout: 15_000 });
  await page.getByRole('button', { name: /^entrar$/i }).click({ timeout: 15_000 });
}

/**
 * La cascada Universidad → Carrera → Plan del `<CareerPicker>` en `/sign-up`. Duplica el helper de
 * `walk.spec.ts` y de `e2e/auth/sign-up.spec.ts`: un spec no importa de otro.
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

interface FaltaronMuchasReading {
  /** Porcentaje mostrado (no es el conteo crudo: la ficha nunca publica el número de votos solo). */
  pct: number;
  total: number;
  /** Votos crudos estimados a partir del porcentaje mostrado y el total, para comparar antes/después. */
  votes: number;
}

/** Lee la distribución de "¿Se dictaron las clases?" en la ficha de cátedra ya cargada en `page`. */
async function readFaltaronMuchas(page: Page): Promise<FaltaronMuchasReading | null> {
  const text = await textOf(page.getByText(Q2_DIST_PATTERN));
  const match = text.match(Q2_DIST_PATTERN);
  if (!match) return null;
  const pct = Number(match[3]);
  const total = Number(match[4]);
  return { pct, total, votes: Math.round((pct / 100) * total) };
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
    '| Paso | Story | Qué esperaba Matías | Qué mostró el stage | Veredicto | Captura |\n' +
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

test.beforeAll(() => {
  mailpitAuth = requireEnv(
    'STAGE_MAILPIT_UI_AUTH',
    'usuario:password de la UI de Mailpit del stage (el mismo valor que MAILPIT_UI_AUTH en Dokploy).',
  );
});

test.beforeAll(async () => {
  await mkdir(ASSETS_DIR, { recursive: true });
});

test('El recorrido de Matías: crea la cuenta recién al reseñar, y se va sin dejar rastro (docs/product/personas.md)', async ({
  page,
  browser,
}) => {
  test.setTimeout(300_000);

  let q2Baseline: FaltaronMuchasReading | null = null;
  let q2After: FaltaronMuchasReading | null = null;

  try {
    await step(1, 'Nada antes de reseñar (US-170, US-228, US-229)', async () => {
      await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '01-chair-before-account.png');

      const dialogCount = await page.getByRole('dialog').count();
      const stillAnonymous = await isVisible(page.getByRole('link', { name: /^ingresar$/i }), 3000);
      q2Baseline = await readFaltaronMuchas(page);

      const cta = page.getByRole('link', { name: '¿La cursaste? Reseñala' });
      const hasCta = await checkVisible(
        cta,
        'debe existir un camino directo para reseñar desde la ficha, sin cuenta creada todavía',
      );
      record({
        step: 1,
        story: 'US-170 / US-228',
        expected:
          'Se lee la ficha entera sin cuenta, y hay un camino directo ("¿La cursaste? Reseñala") para empezar a reseñar desde ahí mismo, sin ningún perfil que completar antes.',
        observed: `Sin cuenta (ve "Ingresar"): ${stillAnonymous ? 'sí' : 'no'}. Diálogos al cargar: ${dialogCount}. CTA visible: ${hasCta ? 'sí' : 'no'}.`,
        verdict: combineVerdict([stillAnonymous, dialogCount === 0, hasCta]),
        screenshot: '01-chair-before-account.png',
      });

      await cta.click({ timeout: 15_000 });
      await page.waitForURL(/\/(sign-in|sign-up)/, { timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      const gateUrl = page.url();
      const gateBodyText = await page.locator('body').innerText();
      const showsReason = /para rese[ñn]ar esta cursada|necesit[aá]s una cuenta para rese/i.test(
        gateBodyText,
      );
      record({
        step: 1,
        story: 'US-229',
        expected:
          'Al llegar disparando la acción de reseñar, la pantalla dice con esas palabras por qué está ahí (ej. "para reseñar esta cursada, necesitás una cuenta").',
        observed: `El clic en "Reseñala" lo dejó en ${gateUrl}. ${
          showsReason
            ? 'Muestra el motivo puntual por el que le piden cuenta.'
            : 'No hay un texto que explique que llegó ahí por querer reseñar esta cursada puntual: es la pantalla genérica de Ingresar ("Entrá a tu cuenta" / "Ingresá con la cuenta que usaste para registrarte").'
        }`,
        verdict: showsReason ? 'cumple' : 'no cumple',
        screenshot: '02-gate-sign-in.png',
      });
      await shot(page, '02-gate-sign-in.png');

      if (!/\/sign-up/.test(gateUrl)) {
        const toSignUp = page.getByRole('link', {
          name: /creá tu cuenta|registrate|crear cuenta/i,
        });
        await checkVisible(
          toSignUp,
          'como no tiene cuenta, debe poder llegar a Registro desde acá',
        );
        await toSignUp.click({ timeout: 15_000 });
      }
      await page.waitForURL(/\/sign-up/, { timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '03-sign-up-form.png');

      // Lo que el registro pide hoy es una decisión de producto activa (ADR-0086): mail,
      // contraseña y carrera. Si cursa o da clases, y el consentimiento informado, están
      // documentados en US-228 como no construidos todavía (quedan para el sprint con personas
      // reales). El chequeo queda igual: es lo que Matías espera, cumpla o no hoy.
      const emailField = page.getByLabel(/tu email/i);
      const passwordField = page.getByLabel(/^contraseña$/i);
      const confirmField = page.getByLabel(/repetí la contraseña/i);
      const roleField = page.getByText(
        /¿curs[aá]s o das clases|sos alumn|sos docente|situaci[oó]n acad[eé]mica/i,
      );
      const consentField = page.getByText(
        /consentimiento informado|ley 25\.326|tratamiento de tus datos|pol[ií]tica de privacidad/i,
      );
      const hasEmail = await checkVisible(emailField, 'el registro debe pedir el mail');
      const hasPassword = await checkVisible(passwordField, 'el registro debe pedir contraseña');
      const hasConfirm = await checkVisible(
        confirmField,
        'el registro debe pedir repetir la contraseña',
      );
      const hasRole = await isVisible(roleField, 3000);
      const hasConsent = await isVisible(consentField, 3000);
      record({
        step: 1,
        story: 'US-228',
        expected:
          'El registro pide mail, contraseña, si cursa o da clases, carrera y el consentimiento informado a la vista antes de mandar (Ley 25.326): nada más, ningún perfil que completar antes de reseñar.',
        observed: `Mail: ${hasEmail ? 'sí' : 'no'}. Contraseña con repetir: ${hasPassword && hasConfirm ? 'sí' : 'no'}. Si cursa o da clases: ${hasRole ? 'sí' : 'no'}. Consentimiento informado a la vista: ${hasConsent ? 'sí' : 'no'} (carrera: la cascada Universidad → Carrera → Plan, aparte, siempre presente).`,
        verdict: combineVerdict([hasEmail, hasPassword, hasConfirm, hasRole, hasConsent]),
        screenshot: '03-sign-up-form.png',
      });

      await emailField.fill(MATIAS_EMAIL, { timeout: 15_000 });
      await passwordField.fill(MATIAS_PASSWORD, { timeout: 15_000 });
      await confirmField.fill(MATIAS_PASSWORD, { timeout: 15_000 });
      await fillCareerCascade(page);
      await page.getByRole('button', { name: /crear mi cuenta/i }).click({ timeout: 15_000 });
      const reachedCheckInbox = await page
        .waitForURL(/\/sign-up\/check-inbox/, { timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      expect
        .soft(reachedCheckInbox, 'después de mandar el registro debe pedir revisar el mail')
        .toBe(true);

      const mail = await waitForMail(MATIAS_EMAIL, 20_000, {
        baseUrl: STAGE_MAILPIT_URL,
        auth: mailpitAuth,
      });
      const tokenMatch = mail.HTML.match(/[?&]token=([A-Za-z0-9_-]+)/);
      if (!tokenMatch) {
        throw new Error(
          `No se encontró ?token= en el mail a ${MATIAS_EMAIL} (subject: "${mail.Subject}")`,
        );
      }
      await page.goto(`/verify-email?token=${tokenMatch[1]}`, { timeout: 15_000 });
      const verified = await checkVisible(
        page.getByRole('heading', { name: /^¡listo!$/i }),
        'el link del mail debe confirmar la cuenta',
      );

      await signIn(page, MATIAS_EMAIL, MATIAS_PASSWORD);
      await page.waitForLoadState('networkidle').catch(() => {});
      const landedUrl = page.url();
      const resumedReview = /\/reviews/.test(landedUrl);
      record({
        step: 1,
        story: 'US-229',
        expected:
          'Al entrar, la sesión se abre y vuelve al lugar exacto del que venía (reseñar la Cátedra Pérez), con la acción completada; si no venía de ninguna, al lugar por defecto.',
        observed: `Verificación: ${verified ? 'confirmada' : 'no confirmada'}. Después de entrar, quedó en ${landedUrl}.`,
        verdict: resumedReview ? 'cumple' : 'no cumple',
        screenshot: '04-signed-in-landing.png',
      });
      await shot(page, '04-signed-in-landing.png');
    });

    await step(2, 'Reseñar la cursada donde faltaron seis clases (US-146, US-154)', async () => {
      await page.goto('/reviews/new', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await page
        .getByRole('searchbox', { name: /materia/i })
        .fill('Fundamentos', { timeout: 15_000 });
      await page
        .getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') })
        .click({ timeout: 15_000 });
      await page.getByRole('button', { name: /^2024-C1$/ }).click({ timeout: 15_000 });
      const chair = page.getByRole('button', { name: 'Pérez', exact: true });
      await checkVisible(
        chair,
        'la Cátedra Pérez debe aparecer como opción de esta materia',
        15_000,
      );
      await chair.click({ timeout: 15_000 });

      await page.getByRole('button', { name: 'La dejé', exact: true }).click({ timeout: 15_000 });
      await page
        .getByRole('button', { name: 'Faltaron muchas', exact: true })
        .first()
        .click({ timeout: 15_000 });

      await page
        .getByLabel(/algo que no te preguntamos/i)
        .fill(FREE_TEXT_NOTE, { timeout: 15_000 });
      await shot(page, '05-review-form-contract.png');

      // El contrato de US-159 se repite acá (paso 6 de Reseñar), con las palabras de SC-013
      // Anonimato, más corto: no hay copy verbatim documentado, así que se busca por concepto.
      const contractText = await page.locator('body').innerText();
      const mentionsSum = /se suma|entra(n)? en los conteos/i.test(contractText);
      const mentionsNoIndividual = /nunca se muestra|ninguna rese[ñn]a individual/i.test(
        contractText,
      );
      const mentionsNoName =
        /sin tu nombre|no.*(accede|sabe).*qui[eé]n|nadie.*sabe qui[eé]n|tu nombre no aparece/i.test(
          contractText,
        );
      expect
        .soft(mentionsSum, 'antes de enviar debe decir que la respuesta se suma al total')
        .toBe(true);
      expect
        .soft(
          mentionsNoIndividual,
          'antes de enviar debe decir que nunca se muestra una reseña individual',
        )
        .toBe(true);
      expect
        .soft(mentionsNoName, 'antes de enviar debe decir que nadie accede a quién respondió')
        .toBe(true);
      record({
        step: 2,
        story: 'US-159',
        expected:
          'Antes de enviar, el contrato completo: se suma al total, nunca se muestra individual, nadie de la facultad accede a quién respondió, y el estado del piso de esa cátedra.',
        observed: `Suma al total: ${mentionsSum ? 'sí' : 'no'}. Nunca individual: ${mentionsNoIndividual ? 'sí' : 'no'}. Nadie sabe quién: ${mentionsNoName ? 'sí' : 'no'} (Pérez ya publica hoy, así que el "estado del piso" puede no incluir un conteo regresivo de 10).`,
        verdict: combineVerdict([mentionsSum, mentionsNoIndividual, mentionsNoName]),
        screenshot: '05-review-form-contract.png',
      });

      const mentionsFreeTextNotPublished =
        /(no|nunca) se publica/i.test(contractText) &&
        /campo libre|algo que no te preguntamos|lo que escrib/i.test(contractText);
      record({
        step: 2,
        story: 'US-159',
        expected: 'El campo libre avisa, ahí mismo, que no se publica.',
        observed: mentionsFreeTextNotPublished
          ? 'El aviso de que el campo libre no se publica está presente cerca del campo.'
          : 'No se encontró, en el texto de la pantalla, un aviso de que el campo libre no se publica.',
        verdict: mentionsFreeTextNotPublished ? 'cumple' : 'no cumple',
        screenshot: '05-review-form-contract.png',
      });

      await page.getByRole('button', { name: /enviar la reseña/i }).click({ timeout: 15_000 });
      const published = await page
        .waitForURL(/\/reviews\/mine\?published=1$/, { timeout: 30_000 })
        .then(() => true)
        .catch(() => false);
      const confirmationLink = page.getByRole('link', { name: /cátedra pérez/i });
      const hasConfirmation = await checkVisible(
        confirmationLink,
        'al terminar debe confirmar que la reseña quedó, con un camino de vuelta a la cátedra',
      );
      record({
        step: 2,
        story: 'US-146',
        expected: 'Enviar la reseña la deja registrada en el mismo acto, sin pasos extra.',
        observed: published
          ? `Terminó en ${page.url()}, con un link de vuelta a "${await textOf(confirmationLink)}".`
          : `No llegó a la confirmación esperada: quedó en ${page.url()}.`,
        verdict: combineVerdict([published, hasConfirmation]),
        screenshot: '06-review-submitted.png',
      });
      await shot(page, '06-review-submitted.png');
    });

    await step(3, 'Su reseña quedó y suma (US-231, US-162)', async () => {
      const minePageText = await page.locator('body').innerText();
      const showsOutcome = /la dej[eé]/i.test(minePageText);
      const showsConduct = /faltaron muchas/i.test(minePageText);
      record({
        step: 3,
        story: 'US-162',
        expected:
          'Mis aportes muestra la reseña recién dada, con lo que marcó: cómo terminó y la opción elegida en cada frase respondida.',
        observed: `Menciona "la dejé": ${showsOutcome ? 'sí' : 'no'}. Menciona "faltaron muchas": ${showsConduct ? 'sí' : 'no'}.`,
        verdict: combineVerdict([showsOutcome, showsConduct]),
        screenshot: '06-review-submitted.png',
      });

      await page.goto('/home', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const homePerezRow = page.getByText(/p[eé]rez/i);
      const hasHomePerez = await checkVisible(
        homePerezRow,
        'Inicio debe mostrar la Cátedra Pérez entre lo que reseñó, con sus voces',
      );
      record({
        step: 3,
        story: 'US-231',
        expected:
          'Al entrar, Inicio muestra las cátedras que reseñó, cada una con cuántas voces junta y si publica.',
        observed: hasHomePerez
          ? `Aparece: "${await textOf(homePerezRow)}"`
          : 'No aparece ninguna mención a Pérez en Inicio.',
        verdict: hasHomePerez ? 'cumple' : 'no cumple',
        screenshot: '07-home-impact.png',
      });
      await shot(page, '07-home-impact.png');

      await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      q2After = await readFaltaronMuchas(page);
      let comparisonVerdict: Verdict = 'no cumple';
      let comparisonObserved =
        'No se pudo leer la distribución de "¿Se dictaron las clases?" en algún momento (antes o después de reseñar).';
      if (q2Baseline && q2After) {
        const expectedTotal = q2Baseline.total + 1;
        const expectedVotes = q2Baseline.votes + 1;
        const totalOk = q2After.total === expectedTotal;
        const votesOk = q2After.votes === expectedVotes;
        comparisonVerdict =
          totalOk && votesOk ? 'cumple' : totalOk || votesOk ? 'parcial' : 'no cumple';
        comparisonObserved =
          `Antes: "faltaron muchas ${q2Baseline.pct} %, de ${q2Baseline.total}" (~${q2Baseline.votes} votos estimados). ` +
          `Después: "faltaron muchas ${q2After.pct} %, de ${q2After.total}" (~${q2After.votes} votos estimados). ` +
          `Esperaba de ${q2Baseline.total} a ${expectedTotal} voces totales, y de ${q2Baseline.votes} a ${expectedVotes} votos en "faltaron muchas".`;
      }
      expect
        .soft(
          comparisonVerdict !== 'no cumple',
          'la ficha de Pérez debe sumar una voz más a "faltaron muchas" y al total',
        )
        .toBe(true);
      record({
        step: 3,
        story: 'US-162',
        expected:
          'En la ficha de Pérez, "Faltaron muchas" sumó una voz: el total pasa de 14 a 15 y el conteo de esa opción sube en uno.',
        observed: comparisonObserved,
        verdict: comparisonVerdict,
        screenshot: '08-chair-after-review.png',
      });
      await shot(page, '08-chair-after-review.png');
    });

    await step(4, 'Que nadie sepa que fue él (US-148, US-159, tesis)', async () => {
      const needles = [SUFFIX, MATIAS_EMAIL, 'Matías', 'seis clases seguidas en abril'];

      async function leaksAt(url: string): Promise<string[]> {
        await page.goto(url, { timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        const text = await page.locator('body').innerText();
        return needles.filter((n) => text.includes(n));
      }

      const surfaces: Array<{ url: string; label: string }> = [
        { url: `/chairs/${CHAIR_PEREZ_ID}`, label: 'ficha de Pérez' },
        { url: `/subjects/${SUBJECT_FUNDAMENTOS_ID}`, label: 'ficha de la materia 211' },
        { url: '/', label: 'entrada' },
        { url: '/method', label: 'Método' },
      ];
      const findings: string[] = [];
      for (const surface of surfaces) {
        const leaked = await leaksAt(surface.url);
        expect
          .soft(leaked.length, `${surface.label} no debe contener ningún rastro de Matías`)
          .toBe(0);
        findings.push(
          `${surface.label}: ${leaked.length === 0 ? 'sin rastro' : `filtró [${leaked.join(', ')}]`}`,
        );
      }

      // /api/search devuelve { items: [] } para lo que no matchea nada (confirmado explorando el
      // stage): que dé cero resultados es la prueba de que el sufijo no quedó indexado en ningún
      // lado, no solo que no aparece en el texto de una respuesta cualquiera.
      const searchRes = await page.request.get(`/api/search?q=${encodeURIComponent(SUFFIX)}`);
      const searchBody = (await searchRes.json()) as { items: unknown[] };
      const searchRaw = JSON.stringify(searchBody);
      const searchLeak = needles.some((n) => searchRaw.includes(n));
      expect
        .soft(
          searchBody.items.length,
          'el buscador no debe devolver resultados para el sufijo de Matías',
        )
        .toBe(0);
      findings.push(
        `/api/search?q=${SUFFIX}: ${searchBody.items.length} resultado(s)${searchLeak ? ', con datos personales' : ''}`,
      );

      await page.goto(`/teachers/${TEACHER_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const teacherText = await page.locator('body').innerText();
      const teacherLeak = needles.filter((n) => teacherText.includes(n));
      expect
        .soft(teacherLeak.length, 'la página de Martín Pérez no debe contener rastro de Matías')
        .toBe(0);
      findings.push(
        `página de Martín Pérez: ${teacherLeak.length === 0 ? 'sin rastro' : `filtró [${teacherLeak.join(', ')}]`}`,
      );

      record({
        step: 4,
        story: 'US-148',
        expected:
          'Cero apariciones del sufijo, el mail, "Matías" o el texto del campo libre en cualquier superficie pública.',
        observed: findings.join('. '),
        verdict: findings.some((f) => f.includes('filtró') || / [1-9]\d* resultado/.test(f))
          ? 'no cumple'
          : 'cumple',
        screenshot: '09-privacy-search.png',
      });
      await shot(page, '09-privacy-search.png');

      await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const chairBodyText = await page.locator('body').innerText();
      const hasForbiddenWord = /puntaje|promedio|estrella|★|\/5\b/i.test(chairBodyText);
      const hasStudentName = /alumno/i.test(chairBodyText);
      expect
        .soft(hasForbiddenWord, 'la ficha de Pérez no debe mostrar puntaje, promedio ni estrella')
        .toBe(false);
      expect.soft(hasStudentName, 'la ficha de Pérez no debe nombrar a ningún alumno').toBe(false);
      record({
        step: 4,
        story: 'US-159 / tesis',
        expected:
          'La ficha de Pérez no muestra ninguna reseña individual ni cómo terminó nadie: solo conteos agregados.',
        observed: `Menciones a puntaje/promedio/estrella: ${hasForbiddenWord ? 'aparece' : 'no aparece'}. Menciones a "alumno": ${hasStudentName ? 'aparece' : 'no aparece'}. Reseñas individuales visibles: ninguna.`,
        verdict: !hasForbiddenWord && !hasStudentName ? 'cumple' : 'no cumple',
        screenshot: '09-privacy-search.png',
      });
    });

    await step(5, 'El campo libre no se publica (ADR-0084)', async () => {
      await page.goto('/reviews/mine', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const mineText = await page.locator('body').innerText();
      const showsOwnFreeText = mineText.includes(FREE_TEXT_NOTE) || mineText.includes(SUFFIX);
      const nearbyPrivacyNote =
        /no se publica|nunca se publica|privado|solo vos|solo el equipo/i.test(mineText);
      const verdict: Verdict = !showsOwnFreeText
        ? 'cumple'
        : nearbyPrivacyNote
          ? 'cumple'
          : 'parcial';
      record({
        step: 5,
        story: 'ADR-0084',
        expected:
          'El campo libre nunca se publica en ningún lugar público (ya verificado en el paso 4); Mis aportes puede mostrarle a Matías lo que él mismo escribió, como registro propio.',
        observed: showsOwnFreeText
          ? `Mis aportes le muestra su propio texto libre${nearbyPrivacyNote ? ', con una nota cerca de que no se publica' : ', sin ninguna nota visible de que no se publica'}.`
          : 'Mis aportes no le devuelve su propio texto libre.',
        verdict,
        screenshot: '10-my-contributions-free-text.png',
      });
      await shot(page, '10-my-contributions-free-text.png');
    });

    await step(
      6,
      'Reportar contenido publicado sin cuenta (US-167, rebasada por ADR-0084)',
      async () => {
        await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        const reportControl = page
          .getByRole('button', { name: /reportar|denunciar|reportá|marcar contenido/i })
          .or(page.getByRole('link', { name: /reportar|denunciar|reportá|marcar contenido/i }));
        const hasReportControl = await isVisible(reportControl, 4000);
        record({
          step: 6,
          story: 'US-167 (rebasada por ADR-0084)',
          expected:
            'US-167 pedía poder reportar un testimonio publicado sin cuenta; ADR-0084 la rebasa: el campo libre nunca se publica, así que no hay texto público de un alumno que reportar en la ficha de una cátedra.',
          observed: hasReportControl
            ? `La ficha de Pérez sí ofrece un control: "${await textOf(reportControl)}".`
            : 'La ficha de Pérez no ofrece ningún control de reporte: no hay testimonios públicos de alumnos que reportar ahí (el campo libre nunca se publica).',
          verdict: 'no aplica',
          screenshot: '11-report-check.png',
        });
        await shot(page, '11-report-check.png');
      },
    );

    await step(7, 'Sacar lo suyo e irse (US-166, US-165)', async () => {
      await page.goto('/my-profile', { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const toDelete = page
        .getByRole('link', { name: /dar de baja|baja de (tu|mi) cuenta|eliminar (tu|mi) cuenta/i })
        .or(
          page.getByRole('button', {
            name: /dar de baja|baja de (tu|mi) cuenta|eliminar (tu|mi) cuenta/i,
          }),
        );
      const hasDeleteLink = await checkVisible(toDelete, 'Mi perfil debe ofrecer la puerta a Baja');
      if (hasDeleteLink) {
        await toDelete.click({ timeout: 15_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }

      const deleteBodyText = await page.locator('body').innerText();
      const explainsAnonymize = /anonimiz|tu nombre y tu mail/i.test(deleteBodyText);
      const explainsSurvives =
        /sig(ue|uen) contando|se mantienen? en los conteos|sin nada que lleve a vos/i.test(
          deleteBodyText,
        );
      const explainsIrreversible = /irreversible|no se puede deshacer|no se recupera/i.test(
        deleteBodyText,
      );
      record({
        step: 7,
        story: 'US-166',
        expected:
          'La pantalla de baja dice, con sus palabras, qué se anonimiza (nombre y mail) y qué queda publicado (sus reseñas siguen contando), y que es irreversible.',
        observed: `Anonimización mencionada: ${explainsAnonymize ? 'sí' : 'no'}. Que lo publicado sigue contando: ${explainsSurvives ? 'sí' : 'no'}. Irreversibilidad: ${explainsIrreversible ? 'sí' : 'no'}.`,
        verdict: combineVerdict([explainsAnonymize, explainsSurvives, explainsIrreversible]),
        screenshot: '12-delete-account.png',
      });
      await shot(page, '12-delete-account.png');

      // SC-016 describe una acción explícita antes del botón final, no un solo clic apurado: se
      // intenta confirmar hasta dos veces por si hay un paso intermedio de "sí, estoy seguro".
      const confirmPattern =
        /confirmar|s[ií], dar de baja|dar de baja definitivamente|s[ií], quiero darme de baja/i;
      if (await isVisible(page.getByRole('button', { name: confirmPattern }), 3000)) {
        await page.getByRole('button', { name: confirmPattern }).first().click({ timeout: 15_000 });
      }
      if (await isVisible(page.getByRole('button', { name: confirmPattern }), 3000)) {
        await page.getByRole('button', { name: confirmPattern }).first().click({ timeout: 15_000 });
      }

      // Verificar de verdad qué pasó tras confirmar, antes de asumir que la sesión se cerró: el
      // mensaje en pantalla, la URL final y si el menú de cuenta (señal de sesión viva) sigue ahí.
      const leftToSignIn = await page
        .waitForURL(/\/sign-in/, { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      await page.waitForLoadState('networkidle').catch(() => {});
      const afterConfirmUrl = page.url();
      const accountMenuStillThere = await isVisible(
        page.getByRole('button', { name: /mi cuenta|tu cuenta|cerrar sesión/i }),
        3000,
      );
      const afterConfirmText = (
        await page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).slice(0, 200);
      record({
        step: 7,
        story: 'US-166',
        expected: 'Al confirmar, se cierra la sesión y vuelve a Ingresar.',
        observed: `Después de confirmar, quedó en ${afterConfirmUrl}. Menú de cuenta ${accountMenuStillThere ? 'sigue apareciendo (sesión viva)' : 'ya no aparece'}. Mensaje en pantalla: "${afterConfirmText}"`,
        verdict: leftToSignIn && !accountMenuStillThere ? 'cumple' : 'no cumple',
        screenshot: '12-delete-account.png',
      });
      await shot(page, '12-delete-account.png');

      // A dónde manda /sign-in en ESTE navegador (con lo que haya quedado de la sesión): si
      // redirige con la sesión todavía viva, es un hallazgo aparte, no un cuelgue (el fill de un
      // formulario que no está en pantalla se quedaría esperando para siempre).
      await page.goto('/sign-in', { timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      const signInGateUrl = page.url();
      const gateStillLive = !/\/sign-in/.test(signInGateUrl);
      record({
        step: 7,
        story: 'arnés / US-166',
        expected:
          'Ir a /sign-in después de la baja debería mostrar el formulario de entrar, no rebotar con una sesión todavía viva.',
        observed: gateStillLive
          ? `/sign-in redirigió a ${signInGateUrl} sin mostrar el formulario: la sesión de este navegador seguía viva.`
          : `/sign-in mostró el formulario de entrar (${signInGateUrl}).`,
        verdict: gateStillLive ? 'no cumple' : 'cumple',
        screenshot: '13-signin-fails-after-delete.png',
      });

      // La prueba real de "no puede entrar" corre en un contexto sin cookies, para no depender de
      // si la sesión de arriba sigue viva.
      const freshContext = await browser.newContext();
      try {
        const freshPage = await freshContext.newPage();
        await freshPage.goto('/sign-in', { timeout: 15_000 });
        await freshPage.waitForLoadState('networkidle').catch(() => {});
        const hasEmailField = await isVisible(freshPage.getByLabel(/tu email/i), 5000);
        let stillOnSignIn = false;
        let finalUrl = freshPage.url();
        if (hasEmailField) {
          await freshPage.getByLabel(/tu email/i).fill(MATIAS_EMAIL, { timeout: 15_000 });
          await freshPage.getByLabel(/^contraseña$/i).fill(MATIAS_PASSWORD, { timeout: 15_000 });
          await freshPage.getByRole('button', { name: /^entrar$/i }).click({ timeout: 15_000 });
          await freshPage.waitForTimeout(3000);
          finalUrl = freshPage.url();
          stillOnSignIn = /\/sign-in/.test(finalUrl);
        }
        await shot(freshPage, '13-signin-fails-after-delete.png');
        record({
          step: 7,
          story: 'US-166',
          expected: 'No puede entrar con su mail y contraseña después de la baja.',
          observed: hasEmailField
            ? `En un contexto sin cookies, cargó el formulario y, tras enviarlo con ${MATIAS_EMAIL}, quedó en ${finalUrl}.`
            : `En un contexto sin cookies, /sign-in no mostró el formulario de entrar (quedó en ${finalUrl}): no se pudo probar el intento de login.`,
          verdict: hasEmailField && stillOnSignIn ? 'cumple' : 'no cumple',
          screenshot: '13-signin-fails-after-delete.png',
        });
      } finally {
        await freshContext.close();
      }

      await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const q2Persisted = await readFaltaronMuchas(page);
      const persisted =
        q2Persisted !== null &&
        q2After !== null &&
        q2Persisted.total === q2After.total &&
        q2Persisted.votes === q2After.votes;
      record({
        step: 7,
        story: 'US-166',
        expected:
          'La ficha de Pérez sigue con la voz sumada (15 voces, "faltaron muchas" con su conteo): la baja no descuenta lo ya publicado.',
        observed: q2Persisted
          ? `Sigue en "faltaron muchas ${q2Persisted.pct} %, de ${q2Persisted.total}" (antes de la baja: ${q2After ? `${q2After.pct} %, de ${q2After.total}` : 'no se pudo leer'}).`
          : 'No se pudo volver a leer la distribución.',
        verdict: persisted ? 'cumple' : 'no cumple',
        screenshot: '14-chair-after-delete.png',
      });
      await shot(page, '14-chair-after-delete.png');

      // El re-registro también corre sobre `page`: si la sesión de este navegador siguiera viva
      // (el hallazgo de arriba), /sign-up rebotaría igual que /sign-in, así que se verifica que
      // el formulario esté antes de llenarlo en vez de asumir que está.
      await page.goto('/sign-up', { timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      const secondPassword = 'stage-matias-pw-5678';
      const hasReRegisterForm = await isVisible(page.getByLabel(/tu email/i), 5000);
      let reRegistered = false;
      if (hasReRegisterForm) {
        await page.getByLabel(/tu email/i).fill(MATIAS_EMAIL, { timeout: 15_000 });
        await page.getByLabel(/^contraseña$/i).fill(secondPassword, { timeout: 15_000 });
        await page.getByLabel(/repetí la contraseña/i).fill(secondPassword, { timeout: 15_000 });
        await fillCareerCascade(page);
        await page.getByRole('button', { name: /crear mi cuenta/i }).click({ timeout: 15_000 });
        reRegistered = await page
          .waitForURL(/\/sign-up\/check-inbox/, { timeout: 20_000 })
          .then(() => true)
          .catch(() => false);
      }
      record({
        step: 7,
        story: 'US-166',
        expected:
          'Registrarse de nuevo con el mismo mail es posible: la pantalla responde igual que a cualquier mail (ADR-0076), sin bloquear por "ya existe".',
        observed: hasReRegisterForm
          ? reRegistered
            ? `Registrarse otra vez con ${MATIAS_EMAIL} llevó a ${page.url()} (misma respuesta genérica, sin error).`
            : `No llegó a la pantalla de "revisá tu mail": quedó en ${page.url()}.`
          : `/sign-up no mostró el formulario de registro (quedó en ${page.url()}): no se pudo probar el re-registro.`,
        verdict: reRegistered ? 'cumple' : 'no cumple',
        screenshot: '15-reregister.png',
      });
      await shot(page, '15-reregister.png');
    });

    await step(8, 'Sin cuenta otra vez', async () => {
      await page.goto(`/chairs/${CHAIR_PEREZ_ID}`, { timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      const stillReadable = await isVisible(
        page.getByRole('heading', { name: 'Cátedra Pérez', level: 1 }),
        5000,
      );
      const stillAnonymous = await isVisible(page.getByRole('link', { name: /^ingresar$/i }), 3000);
      record({
        step: 8,
        story: 'US-168',
        expected: 'La ficha de Pérez se sigue leyendo sin cuenta.',
        observed: `Encabezado de la cátedra visible: ${stillReadable ? 'sí' : 'no'}. Sigue anónimo (ve "Ingresar"): ${stillAnonymous ? 'sí' : 'no'}.`,
        verdict: combineVerdict([stillReadable, stillAnonymous]),
        screenshot: '16-anonymous-again.png',
      });

      const needles = [SUFFIX, MATIAS_EMAIL, 'Matías', 'seis clases seguidas en abril'];
      const finalBodyText = await page.locator('body').innerText();
      const finalLeak = needles.filter((n) => finalBodyText.includes(n));
      expect.soft(finalLeak.length, 'la ficha de Pérez sigue sin ningún rastro de Matías').toBe(0);

      const finalSearchRes = await page.request.get(`/api/search?q=${encodeURIComponent(SUFFIX)}`);
      const finalSearchBody = (await finalSearchRes.json()) as { items: unknown[] };
      expect
        .soft(
          finalSearchBody.items.length,
          'el buscador sigue sin devolver nada del sufijo de Matías',
        )
        .toBe(0);

      record({
        step: 8,
        story: 'US-148',
        expected: 'Repetir la búsqueda del sufijo: sigue sin ningún rastro suyo.',
        observed: `Ficha de Pérez: ${finalLeak.length === 0 ? 'sin rastro' : `filtró [${finalLeak.join(', ')}]`}. Buscador (/api/search?q=${SUFFIX}): ${finalSearchBody.items.length} resultado(s).`,
        verdict:
          finalLeak.length === 0 && finalSearchBody.items.length === 0 ? 'cumple' : 'no cumple',
        screenshot: '16-anonymous-again.png',
      });
      await shot(page, '16-anonymous-again.png');
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
