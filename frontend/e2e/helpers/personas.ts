/**
 * Personas pre-seeded en el backend para E2E.
 *
 * Match 1:1 con `backend/host/Planb.Api/seed-data/personas.json`. Cuando
 * se cambie el seed, este archivo tiene que actualizarse (ojalá pronto
 * tengamos un test de paridad que lo valide automáticamente).
 *
 * Las E2E NO crean usuarios: reusan estos. Eso evita pollution de la DB
 * compartida y mantiene los tests hermeticos respecto a su estado inicial.
 *
 * Si un test modifica la persona (cambia password, etc.), debe restaurarla
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

export const ALL_PERSONAS = [LUCIA, MATEO, PAULA, MARTIN] as const;
