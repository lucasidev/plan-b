import type { APIRequestContext, APIResponse } from '@playwright/test';
import { extractTokenFromLatestMail } from './mailpit';

/**
 * Crea y borra alumnos descartables para los specs E2E que le mutan datos al alumno
 * (enrollments, reseñas).
 *
 * Por qué existe: las personas fijas de `personas.ts` (LUCIA, MATEO, ...) son compartidas por
 * toda la suite. Un spec que le crea un enrollment a LUCIA deja esa fila para siempre, y
 * `enrollment_records` tiene UNIQUE(student_profile_id, subject_id, term_id): la comisión
 * usada no se puede reusar. La suite de reseñas rotaba sobre un pool fijo de ~7 combinaciones
 * sembradas buscando la primera libre; una corrida agotaba casi todo el pool y la siguiente,
 * sin resetear la infra, fallaba con "every seeded commission offering already used". Con un
 * alumno nuevo por test el UNIQUE nunca colisiona (cada `student_profile_id` es un UUID
 * fresco), así que no hace falta pool: siempre alcanza la misma oferta sembrada.
 *
 * Por qué por API y no por UI: esto es setup, no el flujo bajo prueba. Repetir sign-up +
 * verify-email + onboarding por UI en cada spec de reseñas sería lento y frágil (más
 * superficie para flakear por algo ajeno a lo que el spec verifica).
 *
 * Por qué por API y no por SQL directo: `docs/testing/conventions.md` ("Dominio vs infra:
 * cuándo un helper directo está OK") permite helpers de infra (Mailpit, Redis) pero no tocar
 * tablas de dominio (`users`, `student_profiles`, ...) directo. Si hiciera falta borrar algo
 * de dominio que la API no expone, la respuesta es exponer el endpoint, no pegarle a Postgres.
 *
 * Nota sobre `deleteStudent`: `DELETE /api/me/account` (ADR-0044) es self-service: el backend
 * saca el `userId` de la sesión activa (claim `sub` del JWT), nunca de un query param. El hard
 * delete que aceptaba un `userId` externo existió (US-038-b) pero ADR-0044 le sacó el endpoint
 * HTTP cuando lo reemplazó por este soft delete con anonimización; hoy solo queda como comando
 * interno sin ruta. Por eso `deleteStudent` primero re-autentica como el alumno a borrar (con
 * las credenciales que devolvió `createStudent`) y recién ahí llama al DELETE con esa sesión.
 */

/** Plan TUDCS 2018 sembrado por el seed (mismo que usan LUCIA/MATEO en personas.json). */
const DEFAULT_CAREER_PLAN_ID = '00000003-0000-4000-a000-000000000003';
const DEFAULT_ENROLLMENT_YEAR = 2024;

/** Cumple el mínimo de 12 caracteres (RegisterUserValidator, NIST 800-63B). */
const STUDENT_PASSWORD = 'e2e-student-pw-1234';

export interface CreatedStudent {
  email: string;
  password: string;
  userId: string;
  studentProfileId: string;
}

export interface CreateStudentOptions {
  /**
   * Prefijo legible del email generado (default `e2e-student`). Sirve para identificar de qué
   * spec vino un alumno al debuggear Mailpit o los logs del backend.
   */
  emailPrefix?: string;
  careerPlanId?: string;
  enrollmentYear?: number;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@planb.local`;
}

async function ensureOk(response: APIResponse, step: string, email: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '<no body>');
  throw new Error(`createStudent(${email}): ${step} failed with ${response.status()}: ${body}`);
}

/**
 * Decodifica el claim `sub` (userId) del JWT en la cookie `planb_session` que dejó el sign-in.
 * Mismo truco que `auth/onboarding.spec.ts`: no valida firma, solo lee el payload, porque acá
 * lo único que hace falta es el id para poder reportarlo en `CreatedStudent`.
 */
async function readUserIdFromSession(request: APIRequestContext): Promise<string | null> {
  const state = await request.storageState();
  const session = state.cookies.find((c) => c.name === 'planb_session');
  if (!session) return null;

  const payload = session.value.split('.')[1];
  if (!payload) return null;
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
  const json = JSON.parse(
    Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
  ) as { sub?: string };
  return json.sub ?? null;
}

/**
 * Registra un alumno descartable con email único, lo verifica, y le crea el StudentProfile.
 * Devuelve las credenciales (para loguearlo por UI en el spec) y los ids (para debug /
 * cleanup). Usar con `deleteStudent` en un `test.afterEach` para no dejar estado detrás.
 */
export async function createStudent(
  request: APIRequestContext,
  opts: CreateStudentOptions = {},
): Promise<CreatedStudent> {
  const email = uniqueEmail(opts.emailPrefix ?? 'e2e-student');
  const password = STUDENT_PASSWORD;

  const registerResp = await request.post('/api/identity/register', {
    data: { email, password },
  });
  await ensureOk(registerResp, 'register', email);

  const token = await extractTokenFromLatestMail(email);
  const verifyResp = await request.post('/api/identity/verify-email', { data: { token } });
  await ensureOk(verifyResp, 'verify-email', email);

  const signInResp = await request.post('/api/identity/sign-in', { data: { email, password } });
  await ensureOk(signInResp, 'sign-in', email);

  const userId = await readUserIdFromSession(request);
  if (!userId) {
    throw new Error(`createStudent(${email}): could not read userId from session cookie`);
  }

  const profileResp = await request.post('/api/me/student-profiles', {
    data: {
      careerPlanId: opts.careerPlanId ?? DEFAULT_CAREER_PLAN_ID,
      enrollmentYear: opts.enrollmentYear ?? DEFAULT_ENROLLMENT_YEAR,
    },
  });
  await ensureOk(profileResp, 'create student-profile', email);
  const profile = (await profileResp.json()) as { id: string };

  return { email, password, userId, studentProfileId: profile.id };
}

/**
 * Borra (soft delete + anonimización, ADR-0044) el alumno que creó `createStudent`.
 * Re-autentica primero porque el endpoint es self-service: lee el userId de la sesión, no de
 * un parámetro. Idempotente y tolerante a infra: si el alumno ya no existe o el sign-in falla
 * por cualquier motivo, vuelve sin tirar. Pensado para `test.afterEach`, así corre incluso si
 * el test falló a la mitad.
 */
export async function deleteStudent(
  request: APIRequestContext,
  student: Pick<CreatedStudent, 'email' | 'password'>,
): Promise<void> {
  try {
    const signInResp = await request.post('/api/identity/sign-in', {
      data: { email: student.email, password: student.password },
    });
    if (!signInResp.ok()) return;

    await request.delete('/api/me/account');
  } catch {
    // Cleanup best-effort: un problema de infra acá no debe tumbar el resultado del test.
  }
}
