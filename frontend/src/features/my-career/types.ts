/**
 * DTOs del historial académico (GET /api/me/enrollment-records, US-045-e). Mirrors the backend's
 * GetMyTranscriptResponse + TranscriptPeriod + TranscriptEntry records field-for-field (camelCase
 * via JsonOptions), mismo criterio que `pending-reviews/types.ts`.
 */

/** Mirrors the backend's EnrollmentStatus enum. Cinco valores reales del dominio. */
export type EnrollmentStatus = 'Passed' | 'Regularized' | 'InProgress' | 'Failed' | 'Dropped';

/**
 * Una materia dentro de un grupo de período. `approvalMethod` y `grade` son null salvo que el
 * status los requiera (mismo invariante que el aggregate `EnrollmentRecord` del backend).
 *
 * `teacherLastName` es null cuando la cursada no tiene comisión, o la comisión no tiene titular
 * cargado: el enrollment no guarda docente, así que no hay nada que inventar en esos casos.
 */
export type TranscriptEntry = {
  subjectCode: string;
  subjectName: string;
  status: EnrollmentStatus;
  approvalMethod: string | null;
  grade: number | null;
  teacherLastName: string | null;
};

/**
 * Grupo de materias de un mismo período académico. `label`/`year`/`number` son null en conjunto
 * para el grupo de cursadas sin período (equivalencias u otro caso sin cuatrimestre conocido): no
 * se descarta, viaja como un grupo más, identificable por `label === null`.
 *
 * `average` es el promedio de notas del período, null cuando ninguna materia del grupo tiene nota
 * todavía (ADR-0054: una métrica sin sustento viaja null, nunca 0).
 */
export type TranscriptPeriod = {
  label: string | null;
  year: number | null;
  number: number | null;
  average: number | null;
  items: TranscriptEntry[];
};

export type TranscriptResponse = {
  periods: TranscriptPeriod[];
};
