import { apiFetchAuthenticated } from './api-client.server';

/**
 * StudentProfile shape exposed by the backend's GET /api/me/student-profile
 * endpoint (US-037-b). The frontend uses this only to gate the (member) /
 * (onboarding) layouts.
 */
export type StudentProfile = {
  id: string;
  userId: string;
  careerId: string;
  careerPlanId: string;
  enrollmentYear: number;
  status: string;
};

/**
 * Server-side fetch del StudentProfile del user actual. Devuelve `null` si:
 *   - El user no tiene profile todavía (backend 404).
 *   - Cualquier error inesperado de red / 5xx (degrada a "no profile" para que
 *     el guard del layout no rompa la página entera).
 *
 * Auth: post-JwtBearer middleware. Forwardea la cookie planb_session del
 * request del browser via <see cref="apiFetchAuthenticated"/>.
 */
export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  try {
    const response = await apiFetchAuthenticated('/api/me/student-profile', {
      cache: 'no-store',
    });

    if (response.status === 200) {
      return (await response.json()) as StudentProfile;
    }

    return null;
  } catch {
    return null;
  }
}
