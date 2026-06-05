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
 * Server-action state for the US-013-f form. Follows the `idle | error` contract
 * already used by other features (sign-in, onboarding/career).
 */
export type AddEnrollmentFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; field?: string };

export const initialAddEnrollmentState: AddEnrollmentFormState = { status: 'idle' };
