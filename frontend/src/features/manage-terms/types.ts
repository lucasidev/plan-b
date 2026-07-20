/**
 * DTOs del backoffice de períodos lectivos (US-064 admin). Espejan los responses del backend:
 *  - Listado admin de períodos de una uni: GET /api/academic/universities/{universityId}/terms
 *  - Detalle para el form de edición: GET /api/academic/academic-terms/{id}
 *
 * `kind` viaja como string (el backend lo parsea a enum TermKind); `label` siempre lo computa el
 * backend a partir de year/number/kind (`AcademicTerm.ComputeLabel`), nunca lo tipea el admin. A
 * diferencia de Career, acá no hay soft delete: el backend no tiene desactivar/reactivar para
 * AcademicTerm (US-064), así que no hay campo `isActive`.
 */

export type AdminTermRow = {
  id: string;
  year: number;
  number: number;
  kind: string;
  label: string;
  startDate: string;
  endDate: string;
};

/** Detalle completo de un período lectivo, para prefillear el form de edición. */
export type TermDetail = {
  id: string;
  universityId: string;
  year: number;
  number: number;
  kind: string;
  startDate: string;
  endDate: string;
  enrollmentOpens: string;
  enrollmentCloses: string;
  label: string;
};

/**
 * Estado de los server actions de alta/edición de período lectivo (US-064). En success el form
 * redirige al listado de períodos de la uni; en error muestra el mensaje. Mutación pura (ADR-0046):
 * el redirect y el refetch los hace el cliente, no el action.
 */
export type ManageTermFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageTermState: ManageTermFormState = { status: 'idle' };
