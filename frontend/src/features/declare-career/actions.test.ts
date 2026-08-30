import { beforeEach, describe, expect, it, vi } from 'vitest';
import { declareCareerAction } from './actions';
import { initialDeclareCareerState } from './types';

/**
 * Tests del server action que declara la carrera desde Mi perfil.
 *
 * Existen porque el código no los tenía: la salida se escribió en el mismo cambio que retiró el
 * onboarding, y una revisión adversarial encontró que era lo único nuevo del diff sin una sola
 * línea cubierta.
 *
 * Mockeamos el cliente HTTP y la sesión para controlar qué contesta el backend. El action es una
 * mutación pura (ADR-0046): nunca llama `redirect()`, devuelve estado y el cliente refresca.
 */

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';

const apiMock = vi.mocked(apiFetchAuthenticated);
const sessionMock = vi.mocked(getSession);

const PLAN_ID = '33333333-3333-4333-a333-333333333333';

function formData(careerPlanId: string): FormData {
  const fd = new FormData();
  fd.append('careerPlanId', careerPlanId);
  return fd;
}

function problem(status: number, title: string): Response {
  return new Response(JSON.stringify({ title }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({
    userId: 'u-1',
    email: 'lucia@test.com',
    role: 'member',
  });
});

describe('declareCareerAction', () => {
  it('guarda la carrera elegida y no manda nada más', async () => {
    apiMock.mockResolvedValue(new Response(null, { status: 201 }));

    const result = await declareCareerAction(initialDeclareCareerState, formData(PLAN_ID));

    expect(result).toEqual({ status: 'success' });
    // El año de ingreso NO viaja: es un dato del hecho que se cuenta, y lo pregunta la primera
    // reseña una sola vez (US-155).
    expect(apiMock).toHaveBeenCalledWith('/api/me/student-profiles', {
      method: 'POST',
      body: JSON.stringify({ careerPlanId: PLAN_ID }),
    });
  });

  it('sin carrera elegida no le pega al backend', async () => {
    const result = await declareCareerAction(initialDeclareCareerState, formData(''));

    expect(result.status).toBe('error');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('sin sesión no le pega al backend', async () => {
    sessionMock.mockResolvedValue(null);

    const result = await declareCareerAction(initialDeclareCareerState, formData(PLAN_ID));

    expect(result.status).toBe('error');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('avisa que ya hay una carrera declarada cuando el backend responde 409', async () => {
    apiMock.mockResolvedValue(problem(409, 'identity.student_profile.duplicate'));

    const result = await declareCareerAction(initialDeclareCareerState, formData(PLAN_ID));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya ten[eé]s/i);
    }
  });

  it('distingue el plan que no existe de un error pasajero', async () => {
    // Un plan archivado entre que se pintó el picker y se envió no se arregla reintentando:
    // decirle "probá en un rato" deja a la persona reintentando para siempre.
    apiMock.mockResolvedValue(problem(404, 'identity.student_profile.career_plan_not_found'));

    const result = await declareCareerAction(initialDeclareCareerState, formData(PLAN_ID));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).not.toMatch(/en un rato/i);
      expect(result.message).toMatch(/elegi|eleg[íi]|no encontramos/i);
    }
  });

  it('un 500 sí invita a reintentar', async () => {
    apiMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await declareCareerAction(initialDeclareCareerState, formData(PLAN_ID));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/en un rato/i);
    }
  });
});
