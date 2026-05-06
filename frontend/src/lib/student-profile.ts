import { apiFetch } from './api-client';

/**
 * StudentProfile shape exposed by the backend's GET /api/me/student-profiles
 * endpoint (US-037-b). The frontend uses this only to gate the (member) /
 * (onboarding) layouts: "user has profile?" → /home, "user has no profile?"
 * → /onboarding/welcome.
 *
 * Mantenemos el shape como matchea el JSON del backend (PascalCase del C#
 * record, deserializado por Next.js como camelCase via Newtonsoft default).
 * Si el backend cambia naming convention de respuesta, este type se ajusta.
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
 *     el guard del layout no rompa la página entera; el log queda en el server).
 *
 * Caller principal: layouts `(member)/layout.tsx` y `(onboarding)/layout.tsx`.
 *
 * **Auth gap**: el endpoint backend recibe el `userId` por query param porque el
 * JwtBearer middleware todavía no existe. Acá lo extraemos del JWT validado por
 * `getSession()` server-side antes de mandar el fetch — es seguro de nuestro
 * lado, el riesgo es del endpoint si lo invocan con curl.
 */
export async function fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
  try {
    const response = await apiFetch(
      `/api/me/student-profiles?userId=${encodeURIComponent(userId)}`,
      { cache: 'no-store' },
    );

    if (response.status === 200) {
      return (await response.json()) as StudentProfile;
    }

    // 404 = user sin profile (caso esperado durante onboarding).
    // 400 = userId vacío (no debería pasar porque el caller siempre lo pasa real).
    // 5xx = degradar a null y dejar que el guard maneje.
    return null;
  } catch {
    return null;
  }
}
