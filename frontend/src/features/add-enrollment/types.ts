/**
 * DTOs for the Academic catalog endpoints (US-013 unblocker PR1):
 *   - GET /api/academic/subjects?careerPlanId=
 *   - GET /api/academic/academic-terms?universityId=
 * Only the fields the form actually consumes.
 */
export type Subject = {
  id: string;
  careerPlanId: string;
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
};

export type AcademicTerm = {
  id: string;
  universityId: string;
  year: number;
  number: number;
  kind: string;
  label: string;
};

/**
 * Comisión de una materia en un cuatrimestre (US-065). Espeja `CommissionListItem` del backend.
 * Elegir una comisión al cargar la cursada es lo que la hace reseñable después (el docente reseñado
 * tiene que pertenecer a la comisión de la cursada).
 */
export type CommissionTeacher = {
  teacherId: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type Commission = {
  id: string;
  name: string;
  modality: string;
  capacity: number | null;
  teachers: CommissionTeacher[];
};

/**
 * Server-action state for the US-013-f form.
 *
 * `success` existe porque el action es una mutación pura (ADR-0046): hace el write y devuelve el
 * resultado, y es el cliente el que navega. Antes redirigía adentro del action, que es justo el
 * patrón que el ADR prohíbe.
 */
export type AddEnrollmentFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string; field?: string };

export const initialAddEnrollmentState: AddEnrollmentFormState = { status: 'idle' };
