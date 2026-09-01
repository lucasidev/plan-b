/**
 * La gestión de cátedras del backoffice (US-196, SC-027).
 *
 * La cátedra es el equipo docente a cargo de una materia y **persiste entre períodos**, a
 * es la que el alumno recuerda al reseñar. Por eso se entra por
 * materia y no por la cascada de universidad y término.
 */

/** Una cátedra en el listado, con su equipo. Incluye las archivadas: quien carga corrige. */
export type AdminChair = {
  id: string;
  name: string;
  isActive: boolean;
  members: AdminChairMember[];
};

/**
 * Un integrante con su vigencia. `untilTermLabel` en `null` significa que integra hoy, y esa
 * distinción es la que impide atribuirle al titular actual lo que se dictó antes de que llegara.
 */
export type AdminChairMember = {
  teacherId: string;
  firstName: string;
  lastName: string;
  role: string;
  sinceTermLabel: string;
  untilTermLabel: string | null;
};

/** Los roles que el backend acepta, en el orden en que se muestran. */
export const CHAIR_MEMBER_ROLES = [
  'Lead',
  'Associate',
  'PracticalLead',
  'Assistant',
  'Guest',
] as const;

export type ChairMemberRole = (typeof CHAIR_MEMBER_ROLES)[number];

/** Cómo se lee cada rol en pantalla. El valor que viaja es el de la izquierda. */
export const CHAIR_ROLE_LABELS: Record<ChairMemberRole, string> = {
  Lead: 'Titular',
  Associate: 'Adjunto',
  PracticalLead: 'JTP',
  Assistant: 'Ayudante',
  Guest: 'Invitado',
};

export type ManageChairFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success' };

export const initialManageChairState: ManageChairFormState = { status: 'idle' };
