/**
 * DTOs de los endpoints catálogo Academic (PR1 destrabante de US-013):
 *   - GET /api/academic/subjects?careerPlanId=
 *   - GET /api/academic/academic-terms?universityId=
 * Sólo los fields que el form realmente consume.
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
 * Estado del server action del form de US-013-f. Sigue el contrato `idle |
 * error` que ya usan otros features (sign-in, onboarding/career).
 */
export type AddEnrollmentFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: string };

export const initialAddEnrollmentState: AddEnrollmentFormState = { status: 'idle' };
