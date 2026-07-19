/**
 * DTOs del backoffice de carreras y planes (US-061 admin). Espejan los responses del backend:
 *  - Listado admin de carreras de una uni: GET /api/academic/universities/{universityId}/careers
 *  - Detalle de carrera para el form de edición: GET /api/academic/careers/{id}
 *  - Planes de una carrera: GET /api/academic/careers/{careerId}/plans
 *
 * Los campos académicos (degreeType, durationYears, cadence, description) y el label del plan son
 * opcionales (el crowdsourcing US-088 no los carga); el form admin los completa. degreeType/cadence
 * viajan como string (el backend los parsea a enum, ADR-0049 para el modelo de plan year+status).
 */

export type AdminCareerRow = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  code: string | null;
  isOfficial: boolean;
  isActive: boolean;
  /** Cantidad de planes de estudio de la carrera (badge del listado admin). */
  planCount: number;
};

/** Detalle completo de una carrera, para prefillear el form de edición. */
export type CareerDetail = {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  shortName: string | null;
  code: string | null;
  degreeType: string | null;
  durationYears: number | null;
  cadence: string | null;
  description: string | null;
  isOfficial: boolean;
  isActive: boolean;
};

/** Fila del listado de planes de una carrera (US-061). `status` es "Active" | "Deprecated" (ADR-0049). */
export type CareerPlanRow = {
  id: string;
  year: number;
  status: string;
  isOfficial: boolean;
  label: string | null;
};

/**
 * Estado de los server actions de alta/edición de carrera (US-061). En success el form redirige al
 * listado de carreras de la uni; en error muestra el mensaje. Mutación pura (ADR-0046): el redirect
 * y el refetch los hace el cliente, no el action.
 */
export type ManageCareerFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageCareerState: ManageCareerFormState = { status: 'idle' };

/** Estado del alta de un plan de estudios (US-061). El detalle refetchea los planes en success. */
export type ManagePlanFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManagePlanState: ManagePlanFormState = { status: 'idle' };

/** Resultado de los toggles de estado (carrera: desactivar/reactivar; plan: deprecar/reactivar). */
export type ToggleResult = { ok: true } | { ok: false; message: string };
