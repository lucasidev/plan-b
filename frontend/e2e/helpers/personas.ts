/**
 * Personas pre-seeded en el backend para E2E.
 *
 * Match 1:1 con `backend/host/Planb.Api/seed-data/personas.json`. Cuando
 * se cambie el seed, este archivo tiene que actualizarse (ojalá pronto
 * tengamos un test de paridad que lo valide automáticamente).
 *
 * Estas personas son compartidas por TODA la suite: úsalas solo para flujos que no le mutan
 * datos al alumno (login, recuperar password, gating de roles/permisos). Si un spec necesita
 * crearle datos al alumno (enrollments, reseñas), usa `createStudent` / `deleteStudent` de
 * `students.ts` en vez de una de estas personas.
 *
 * Por qué: probamos exactamente eso con los specs de reseñas. Todos creaban enrollments para
 * LUCIA tomando de un pool fijo de comisiones sembradas (`enrollment_records` tiene
 * UNIQUE(student_profile_id, subject_id, term_id), así que cada test consumía una comisión del
 * pool y nadie las liberaba). Una corrida agotaba casi todo el pool y la siguiente, sin
 * resetear la infra, fallaba. Un alumno descartable por test evita el problema de raíz: cada
 * `student_profile_id` es un UUID fresco, así que el UNIQUE nunca colisiona entre corridas.
 *
 * Si un test SÍ modifica una de estas personas (cambia password, etc.), debe restaurarla
 * al estado original al final. Ver `forgot-password.spec.ts` como ejemplo.
 */

export interface Persona {
  email: string;
  password: string;
  displayName: string;
  state: 'VerifiedActive' | 'Disabled' | 'Unverified';
}

export const LUCIA: Persona = {
  email: 'lucia.mansilla@gmail.com',
  password: 'lucia.mansilla.12',
  displayName: 'Lucía Mansilla',
  state: 'VerifiedActive',
};

export const MATEO: Persona = {
  email: 'mateo.gimenez@hotmail.com',
  password: 'mateo.gimenez.12',
  displayName: 'Mateo Giménez',
  state: 'VerifiedActive',
};

export const PAULA: Persona = {
  email: 'paula.suspendida@planb.local',
  password: 'paula.suspendida.12',
  displayName: 'Paula Suárez',
  state: 'Disabled',
};

export const MARTIN: Persona = {
  email: 'martin.pendiente@planb.local',
  password: 'martin.pendiente.12',
  displayName: 'Martín Acosta',
  state: 'Unverified',
};

/** Cuenta staff rol Admin (US-067): backoffice completo. */
export const ADMIN: Persona = {
  email: 'admin@planb.local',
  password: 'admin.planb.local.12',
  displayName: 'Lautaro Maza',
  state: 'VerifiedActive',
};

/** Cuenta staff rol Moderator (US-067): solo la sección de moderación del backoffice. */
export const MODERADOR: Persona = {
  email: 'moderador@planb.local',
  password: 'moderador.planb.local.12',
  displayName: 'Elena Ferro',
  state: 'VerifiedActive',
};

export const ALL_PERSONAS = [LUCIA, MATEO, PAULA, MARTIN, ADMIN, MODERADOR] as const;
