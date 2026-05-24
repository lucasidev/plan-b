/**
 * Shape del response del GET /api/me/student-profile (espeja `StudentProfileResponse` backend).
 * Lo usamos para hidratar la pantalla Mi perfil.
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
 * Estado del server action de update. Auto-save por campo del edit form:
 * - idle inicial
 * - success cuando 204 (mostramos check inline + revert a view mode)
 * - error con copy si 4xx/5xx
 */
export type UpdateProfileFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialUpdateProfileState: UpdateProfileFormState = { status: 'idle' };
