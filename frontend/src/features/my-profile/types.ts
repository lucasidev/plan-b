/**
 * Response shape of GET /api/me/student-profile (mirrors the backend's
 * `StudentProfileResponse`). Used to hydrate the Mi perfil screen.
 */
export type MyProfile = {
  id: string;
  userId: string;
  careerId: string;
  careerPlanId: string;
  enrollmentYear: number;
  status: string;
  displayName: string | null;
  yearOfStudy: number | null;
  legajo: string | null;
  regularStudent: boolean;
  updatedAt: string | null;
  email: string;
  memberSince: string;
};

/**
 * Server-action state for update. Per-field auto-save of the edit form:
 * - idle initial
 * - success when 204 (we show an inline check + revert to view mode)
 * - error with copy on 4xx/5xx
 */
export type UpdateProfileFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialUpdateProfileState: UpdateProfileFormState = { status: 'idle' };
