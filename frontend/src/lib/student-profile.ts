import { cache } from 'react';
import { apiFetchAuthenticated } from './api-client.server';

/**
 * StudentProfile shape exposed by the backend's GET /api/me/student-profile
 * endpoint (US-037-b). The frontend uses this to gate the (member) / (onboarding)
 * layouts and to label the chrome with the real university + career.
 */
export type StudentProfile = {
  id: string;
  userId: string;
  careerId: string;
  careerPlanId: string;
  /** ADR-0086: la carrera se declara al registrarse y el año de ingreso ya no se pide ahí,
   * así que puede no estar. */
  enrollmentYear: number | null;
  status: string;
  /** Display labels resueltos cross-schema en el backend. Nullable defensivo (LEFT JOIN). La
   * universidad es el slug/acrónimo ("unsta"); la carrera es el nombre completo. */
  careerName: string | null;
  universityShortName: string | null;
  /**
   * Id de la universidad del alumno (derivado de career -> university, mismo LEFT JOIN que
   * `universityShortName`). Lo necesita el planificador (US-096) para listar los períodos
   * lectivos de esa universidad (`GET /api/academic/academic-terms?universityId=`).
   */
  universityId: string | null;
};

/**
 * Server-side fetch del StudentProfile del user actual. Devuelve `null` si:
 *   - El user no tiene profile todavía (backend 404).
 *   - Cualquier error inesperado de red / 5xx (degrada a "no profile" para que
 *     el guard del layout no rompa la página entera).
 *
 * Auth: post-JwtBearer middleware. Forwardea la cookie planb_session del
 * request del browser via <see cref="apiFetchAuthenticated"/>.
 *
 * **Memoizado por request con `cache()` de React.** El guard del layout y la page de cada
 * pantalla piden el perfil por separado, a propósito (defensa en profundidad: el layout redirige
 * al onboarding y la page vuelve a chequear). Sin esto eran dos GET idénticos por render, porque
 * `cache: 'no-store'` deshabilita el fetch cache de Next y no hay nada más que deduplique. La
 * memoización vive por request y muere con ella, así que no hay riesgo de servirle a un usuario
 * el perfil de otro.
 */
export const fetchStudentProfile = cache(async (): Promise<StudentProfile | null> => {
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
});
