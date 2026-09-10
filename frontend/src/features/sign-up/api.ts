import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/register (202 exista o no la cuenta, ADR-0076). Returns the raw Response so the action can
 * branch on status and parse the JSON only when relevant.
 *
 * `careerId` y `careerPlanId` viajan en este mismo request (ADR-0086: la carrera se declara al
 * registrarse, ya no en un paso de onboarding aparte). `careerPlanId` es null cuando la carrera
 * elegida todavía no tiene un plan relevado.
 */

export type RegisterRequestBody = {
  email: string;
  password: string;
  careerId: string;
  careerPlanId: string | null;
};

export function registerUser(body: RegisterRequestBody): Promise<Response> {
  return apiFetch('/api/identity/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
