/**
 * DTOs del backoffice de comisiones (US-093 admin). Espejan los responses del backend:
 *  - Listado global de un término, cross-materia: GET /api/academic/terms/{termId}/commissions
 *    (pantalla principal "Comisiones · término"). No trae `notes`.
 *  - Listado de una materia+término: GET /api/academic/subjects/{subjectId}/commissions/admin?termId=
 *    (se reusa para reconstruir el detalle de UNA comisión al editar: es el único listado que trae
 *    `notes`, porque no existe un GET de detalle por id).
 *
 * `modality` viaja como string (el backend lo parsea a `CommissionModality`, valores ya en español:
 * "Presencial" | "Virtual" | "Hibrida"); `role` como string (`CommissionTeacherRole`); `day` como el
 * nombre en inglés del `DayOfWeek` ("Monday".."Sunday"); `start`/`end` como "HH:mm".
 */

export type CommissionScheduleBlock = {
  day: string;
  start: string;
  end: string;
};

export type CommissionTeacherAssignment = {
  teacherId: string;
  firstName: string;
  lastName: string;
  role: string;
};

/** Fila del listado global de comisiones de un término, cross-materia (US-093). */
export type TermCommissionRow = {
  commissionId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  name: string;
  modality: string;
  capacity: number | null;
  isActive: boolean;
  teachers: CommissionTeacherAssignment[];
  schedule: CommissionScheduleBlock[];
};

/**
 * Fila del listado admin de una materia+término (US-093): mismo detalle que `TermCommissionRow` pero
 * con `notes` (y sin subject info, porque acá ya está fija). Solo se usa para prefillear el form de
 * edición.
 */
export type SubjectCommissionRow = {
  id: string;
  name: string;
  modality: string;
  capacity: number | null;
  notes: string | null;
  isActive: boolean;
  teachers: CommissionTeacherAssignment[];
  schedule: CommissionScheduleBlock[];
};

/**
 * Materia elegible para crear una comisión nueva (US-093). No existe un listado admin "materias por
 * universidad" (el catálogo solo lista por plan): esta opción sale de recorrer
 * universidad → carreras activas → plan vigente → materias activas y aplanarlas en una sola lista,
 * rotulada con carrera/plan para que el select sea legible. `termKind` se usa para filtrar del lado
 * de la página las materias cuya cadencia coincide con la del término elegido (evita un 400
 * `term_kind_mismatch` seguro).
 */
export type CommissionSubjectOption = {
  id: string;
  code: string;
  name: string;
  termKind: string;
  careerName: string;
  planLabel: string | null;
};

/** Docente elegible para asignar a una comisión: de la misma universidad que el término. */
export type CommissionTeacherOption = {
  id: string;
  firstName: string;
  lastName: string;
};

/**
 * Estado de los server actions de alta/edición (US-093). En success el cliente redirige al listado
 * "Comisiones · término"; en error muestra el mensaje. Mutación pura (ADR-0046).
 */
export type ManageCommissionFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageCommissionState: ManageCommissionFormState = { status: 'idle' };

/** Resultado de los toggles de estado (desactivar / reactivar), invocados desde los botones de fila. */
export type ToggleResult = { ok: true } | { ok: false; message: string };
