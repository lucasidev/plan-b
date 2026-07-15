import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de gestión de universidades (US-060 admin). Mocks de borde:
 *   - `@/lib/session`           → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe cada action.
 *
 * Cubrimos el gate de rol (solo admin), el mapeo Zod → mensaje de error, el armado del array de
 * dominios institucionales desde múltiples entries de FormData, y el mapeo de cada status HTTP a
 * mensaje (create/update comparten `mapWriteResponse`; deactivate/reactivate comparten `toggle`).
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
  createUniversityAction,
  deactivateUniversityAction,
  reactivateUniversityAction,
  updateUniversityAction,
} from './actions';
import { initialManageUniversityState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const UNIVERSITY_ID = '11111111-1111-4111-a111-111111111111';
const VALID_INPUT = { name: 'UNSTA', slug: 'unsta' };

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

describe('createUniversityAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida el slug, sin llamar al backend', async () => {
    const result = await createUniversityAction(
      initialManageUniversityState,
      formData({ ...VALID_INPUT, slug: 'UNSTA con espacios' }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('junta los dominios institucionales de múltiples entries en un array', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: UNIVERSITY_ID }));

    await createUniversityAction(
      initialManageUniversityState,
      formData({
        ...VALID_INPUT,
        institutionalEmailDomains: ['unsta.edu.ar', 'alumnos.unsta.edu.ar'],
      }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/academic/universities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'UNSTA',
          slug: 'unsta',
          institutionalEmailDomains: ['unsta.edu.ar', 'alumnos.unsta.edu.ar'],
        }),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: UNIVERSITY_ID }));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('success');
  });

  it('400 mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('409 mapea a slug duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/slug ya está en uso/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear la universidad/i);
    }
  });
});

describe('updateUniversityAction', () => {
  it('rechaza sin id, sin llamar al backend', async () => {
    const result = await updateUniversityAction(
      initialManageUniversityState,
      formData(VALID_INPUT),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la universidad/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateUniversityAction(
      initialManageUniversityState,
      formData({ ...VALID_INPUT, id: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: UNIVERSITY_ID }));

    const result = await updateUniversityAction(
      initialManageUniversityState,
      formData({ ...VALID_INPUT, id: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('success');
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/universities/${UNIVERSITY_ID}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('404 mapea a universidad no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateUniversityAction(
      initialManageUniversityState,
      formData({ ...VALID_INPUT, id: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la universidad/i);
    }
  });

  it('409 mapea a slug duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await updateUniversityAction(
      initialManageUniversityState,
      formData({ ...VALID_INPUT, id: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/slug ya está en uso/i);
    }
  });
});

describe('deactivateUniversityAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await deactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: UNIVERSITY_ID, isActive: false }));

    const result = await deactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/universities/${UNIVERSITY_ID}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('409 mapea a "ya estaba en ese estado"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await deactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('404 mapea a universidad no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await deactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la universidad/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await deactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('reactivateUniversityAction', () => {
  it('200 devuelve ok', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: UNIVERSITY_ID, isActive: true }));

    const result = await reactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/universities/${UNIVERSITY_ID}/reactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await reactivateUniversityAction(UNIVERSITY_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });
});
