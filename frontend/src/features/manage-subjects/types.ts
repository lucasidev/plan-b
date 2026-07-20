/**
 * DTOs del backoffice de materias de un plan de estudios + correlativas (US-062 admin). Espejan los
 * responses del backend:
 *  - Listado admin de materias de un plan: GET /api/academic/career-plans/{planId}/subjects
 *  - Detalle para el form de edición: GET /api/academic/career-plans/{planId}/subjects/{subjectId}
 *    (mismo shape que la fila del listado: el backend no separa list item de detail item acá).
 *  - Grafo de correlativas del plan entero: GET /api/academic/career-plans/{planId}/prerequisites
 *
 * `termKind` viaja como string (el backend lo parsea a enum TermKind, mismo criterio que
 * AcademicTerm.kind en manage-terms). El `type` de Prerequisite es un literal fijo del contrato HTTP
 * (ADR-0003): "para cursar" y "para rendir" son dos DAGs separados sobre las mismas materias.
 */

export type AdminSubjectRow = {
  id: string;
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
  weeklyHours: number;
  totalHours: number;
  description: string | null;
  isOfficial: boolean;
  isActive: boolean;
};

/** Detalle de una materia para prefillear el form de edición: mismo shape que `AdminSubjectRow`. */
export type SubjectDetail = AdminSubjectRow;

export type PrerequisiteType = 'ParaCursar' | 'ParaRendir';

/** Arista del grafo de correlativas: `subjectId` requiere `requiredSubjectId` según `type`. */
export type PrerequisiteEdge = {
  subjectId: string;
  requiredSubjectId: string;
  type: PrerequisiteType;
};

/**
 * Estado de los server actions de alta/edición de materia (US-062). En success el form redirige al
 * listado de materias del plan; en error muestra el mensaje. Mutación pura (ADR-0046): el redirect
 * y el refetch los hace el cliente, no el action.
 */
export type ManageSubjectFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageSubjectState: ManageSubjectFormState = { status: 'idle' };

/** Estado del alta de una correlativa (panel de correlativas). El panel refetchea el grafo en success. */
export type ManagePrerequisiteFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManagePrerequisiteState: ManagePrerequisiteFormState = { status: 'idle' };

/** Resultado de los toggles simples (reactivar materia, quitar correlativa): sin datos extra. */
export type ToggleResult = { ok: true } | { ok: false; message: string };

/** Materia dependiente que devuelve el 409 has_dependents al intentar archivar una materia. */
export type SubjectDependent = { id: string; code: string; name: string };

/**
 * Resultado de archivar una materia (soft delete, DELETE /api/academic/subjects/{id}). Además del
 * mensaje, el 409 has_dependents trae el listado de materias dependientes: la UI lo muestra
 * explícito en vez de un error genérico (US-062).
 */
export type DeactivateSubjectResult =
  | { ok: true }
  | { ok: false; message: string; dependents?: SubjectDependent[] };
