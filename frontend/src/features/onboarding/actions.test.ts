import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del server action `submitCareerAction` (onboarding step 02, US-037-f). Mocks de
 * borde:
 *   - `next/navigation`        → redirect que tira un NEXT_REDIRECT atrapable.
 *   - `@/lib/session`          → fake de getSession para simular session OK / null.
 *   - `@/lib/api-client.server` → controla la Response que recibe el action.
 *
 * Foco: el mapeo de status HTTP a `OnboardingCareerFormState`, en particular que un 400 con
 * el code `enrollment_year_out_of_range` (el aggregate rechazando un año que el Zod
 * client-side no puede replicar del todo porque depende del clock del servidor) aterrice en
 * el campo `enrollmentYear`, no en el banner genérico.
 */

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { submitCareerAction } from './actions';
import { initialOnboardingCareerState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'lucia@unsta.edu.ar',
  role: 'member' as const,
};

const VALID_INPUT = {
  universityId: '11111111-1111-4111-a111-111111111111',
  careerId: '22222222-2222-4222-a222-222222222222',
  careerPlanId: '33333333-3333-4333-a333-333333333333',
  enrollmentYear: '2005',
};

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(SESSION);
});

describe('submitCareerAction', () => {
  it('devuelve error cuando no hay sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error de Zod cuando falta un campo, sin llamar al backend', async () => {
    const result = await submitCareerAction(
      initialOnboardingCareerState,
      formData({ ...VALID_INPUT, careerPlanId: '' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('Elegí un plan de estudios');
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('201 redirige a /onboarding/history', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201));

    await expect(
      submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT)),
    ).rejects.toThrow(/NEXT_REDIRECT:\/onboarding\/history/);
  });

  it('409 mapea a "ya tenés un perfil"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya tenés un perfil/i);
      expect(result.field).toBeUndefined();
    }
  });

  it('400 con code enrollment_year_out_of_range aterriza en el campo enrollmentYear', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(400, {
        title: 'identity.student_profile.enrollment_year_out_of_range',
        detail: 'Enrollment year must be between 1990 and the current year.',
      }),
    );

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.field).toBe('enrollmentYear');
      expect(result.message).toMatch(/1990/);
    }
  });

  it('400 con otro code cae al mensaje genérico, sin marcar ningún campo', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(400, { title: 'identity.student_profile.career_plan_not_found' }),
    );

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.field).toBeUndefined();
      expect(result.message).toMatch(/no son válidos/i);
    }
  });

  it('403 mapea a "cuenta todavía no está verificada"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no está verificada/i);
    }
  });

  it('cae al mensaje genérico cuando el backend devuelve 500', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await submitCareerAction(initialOnboardingCareerState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos completar el onboarding/i);
    }
  });
});
