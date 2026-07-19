import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de gestión de carreras y planes de estudio (US-061 admin). Mocks de
 * borde:
 *   - `@/lib/session`           → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe cada action.
 *
 * Cubrimos el gate de rol (solo admin), el mapeo Zod → mensaje de error, la falta del id requerido
 * (universityId/id/careerId) sin llamar al backend, y el mapeo de cada status HTTP a mensaje
 * (create/update de carrera comparten `mapWriteResponse`; los 4 toggles comparten `toggle`).
 */

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import {
  createCareerAction,
  createPlanAction,
  deactivateCareerAction,
  deprecatePlanAction,
  reactivateCareerAction,
  reactivatePlanAction,
  updateCareerAction,
} from './actions';
import { initialManageCareerState, initialManagePlanState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const UNIVERSITY_ID = '00000001-0000-4000-a000-000000000001';
const CAREER_ID = '00000002-0000-4000-a000-000000000001';
const PLAN_ID = '00000003-0000-4000-a000-000000000001';
const VALID_CAREER = { name: 'Ingeniería E2E', slug: 'ingenieria-e2e' };
const VALID_PLAN = { year: '2023' };

function formData(values: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.append(k, v);
    }
  }
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
  getSessionMock.mockResolvedValue(ADMIN_SESSION);
});

describe('createCareerAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol moderator, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin universityId, sin llamar al backend', async () => {
    const result = await createCareerAction(initialManageCareerState, formData(VALID_CAREER));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la universidad/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida el slug, sin llamar al backend', async () => {
    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, slug: 'con espacios', universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: CAREER_ID }));

    await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/universities/${UNIVERSITY_ID}/careers`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(VALID_CAREER),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: CAREER_ID }));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('success');
  });

  it('400 mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 mapea a universidad o carrera no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la universidad o la carrera/i);
    }
  });

  it('409 mapea a slug o código duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/slug o código ya está en uso/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear la carrera/i);
    }
  });
});

describe('updateCareerAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin id, sin llamar al backend', async () => {
    const result = await updateCareerAction(initialManageCareerState, formData(VALID_CAREER));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la carrera a editar/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida el slug, sin llamar al backend', async () => {
    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, slug: 'CON-MAYUSCULAS', id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve success y llama PATCH a la URL de la carrera', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: CAREER_ID }));

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('success');
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/careers/${CAREER_ID}`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(VALID_CAREER) }),
    );
  });

  it('404 mapea a universidad o carrera no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la universidad o la carrera/i);
    }
  });

  it('409 mapea a slug o código duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/slug o código ya está en uso/i);
    }
  });

  it('500 cae al mensaje fallback de edición', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos guardar los cambios/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await updateCareerAction(
      initialManageCareerState,
      formData({ ...VALID_CAREER, id: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('deactivateCareerAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok y llama DELETE a la URL de la carrera', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: CAREER_ID, isActive: false }));

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/careers/${CAREER_ID}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('404 mapea a carrera no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la carrera/i);
    }
  });

  it('409 mapea a "ya estaba en ese estado"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await deactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('reactivateCareerAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await reactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok y llama POST a reactivate', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: CAREER_ID, isActive: true }));

    const result = await reactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/careers/${CAREER_ID}/reactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('404 mapea a carrera no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await reactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la carrera/i);
    }
  });

  it('409 mapea a "ya estaba en ese estado"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await reactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await reactivateCareerAction(CAREER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('createPlanAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin careerId, sin llamar al backend', async () => {
    const result = await createPlanAction(initialManagePlanState, formData(VALID_PLAN));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la carrera del plan/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida el año, sin llamar al backend', async () => {
    const futureYear = new Date().getFullYear() + 1;
    const result = await createPlanAction(
      initialManagePlanState,
      formData({ year: String(futureYear), careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: PLAN_ID }));

    await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/careers/${CAREER_ID}/plans`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ year: 2023 }),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: PLAN_ID }));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('success');
  });

  it('400 mapea a mensaje de año inválido', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá el año/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 mapea a carrera no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la carrera/i);
    }
  });

  it('409 mapea a plan duplicado para ese año', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe un plan para ese año/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createPlanAction(
      initialManagePlanState,
      formData({ ...VALID_PLAN, careerId: CAREER_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear el plan/i);
    }
  });
});

describe('deprecatePlanAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok y llama POST a deprecate', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: PLAN_ID, status: 'Deprecated' }));

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/career-plans/${PLAN_ID}/deprecate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('404 mapea a plan no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos el plan/i);
    }
  });

  it('409 mapea a "ya estaba en ese estado"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await deprecatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('reactivatePlanAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await reactivatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok y llama POST a reactivate', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: PLAN_ID, status: 'Active' }));

    const result = await reactivatePlanAction(PLAN_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/career-plans/${PLAN_ID}/reactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('404 mapea a plan no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await reactivatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos el plan/i);
    }
  });

  it('409 mapea a "ya estaba en ese estado"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await reactivatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await reactivatePlanAction(PLAN_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});
