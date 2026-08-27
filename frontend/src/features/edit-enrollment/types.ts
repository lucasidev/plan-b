import type { EnrollmentStatus } from '@/features/my-career/types';

/**
 * La cursada tal como está guardada, para precargar el form. La arma la page resolviendo el
 * `enrollmentId` de la ruta contra el historial (GET /api/me/enrollment-records): la lista ya trae
 * todo lo que el editor necesita y es corta, así que un endpoint por id sería prematuro. Mismo
 * criterio que `my-course-reviews`, donde corregir una reseña también se precarga del listado.
 */
export type EnrollmentToEdit = {
  id: string;
  /** No es editable: lo necesita el listado de comisiones, que se identifica por (materia, período). */
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  commissionId: string | null;
  termId: string | null;
  status: EnrollmentStatus;
  approvalMethod: string | null;
  grade: number | null;
};

/**
 * Estado del server action. `success` existe (a diferencia del alta, que redirige adentro del
 * action) porque ADR-0046 fija que el action es mutación pura: navega el cliente cuando ve el
 * status, no el server adentro del stream de la respuesta.
 */
export type EditEnrollmentFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string; field?: string };

export const initialEditEnrollmentState: EditEnrollmentFormState = { status: 'idle' };
