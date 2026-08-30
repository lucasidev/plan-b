import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/register (202 exista o no la cuenta, ADR-0076). Returns the raw Response so the action can
 * branch on status and parse the JSON only when relevant.
 *
 * `careerPlanId` viaja en este mismo request (ADR-0086: la carrera se declara al registrarse,
 * ya no en un paso de onboarding aparte).
 */

export type RegisterRequestBody = {
  email: string;
  password: string;
  careerPlanId: string;
};

export function registerUser(body: RegisterRequestBody): Promise<Response> {
  return apiFetch('/api/identity/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
