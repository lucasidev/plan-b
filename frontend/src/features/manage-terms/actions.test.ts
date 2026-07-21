import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de gestión de períodos lectivos (US-064 admin). Mocks de borde:
 *   - `@/lib/session`           → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe cada action.
 *
 * Cubrimos el gate de rol (solo admin), el mapeo Zod → mensaje de error, la falta del id requerido
 * (universityId/id) sin llamar al backend, y el mapeo de cada status HTTP a mensaje (create/update
 * comparten `mapWriteResponse`).
 */

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { createTermAction, updateTermAction } from './actions';
import { initialManageTermState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const UNIVERSITY_ID = '00000001-0000-4000-a000-000000000001';
const TERM_ID = '00000005-0000-4000-a000-000000000099';

/** Forma "string" de los campos, tal cual los manda un `<form>` (formData siempre son strings). */
const VALID_TERM = {
  year: '2026',
  number: '1',
  kind: 'FourMonth',
  startDate: '2026-03-01',
  endDate: '2026-07-01',
  enrollmentOpens: '2026-02-01T00:00',
  enrollmentCloses: '2026-02-20T00:00',
};

/** Forma post-Zod (year/number coercionados a number): lo que espera recibir el backend. */
const VALID_TERM_BODY = {
  year: 2026,
  number: 1,
  kind: 'FourMonth',
  startDate: '2026-03-01',
  endDate: '2026-07-01',
  enrollmentOpens: '2026-02-01T00:00',
  enrollmentCloses: '2026-02-20T00:00',
};

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

describe('createTermAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol moderator, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin universityId, sin llamar al backend', async () => {
    const result = await createTermAction(initialManageTermState, formData(VALID_TERM));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la universidad/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (kind vacío), sin llamar al backend', async () => {
    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, kind: '', universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida la regla cross-field (anual con number != 1), sin llamar al backend', async () => {
    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, kind: 'FullYear', number: '2', universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: TERM_ID }));

    await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/universities/${UNIVERSITY_ID}/terms`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(VALID_TERM_BODY),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: TERM_ID }));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('success');
  });

  it('400 mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 mapea a universidad o período no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la universidad o el período/i);
    }
  });

  it('409 mapea a período duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe un período con ese año/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, universityId: UNIVERSITY_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear el período/i);
    }
  });
});

describe('updateTermAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin id, sin llamar al backend', async () => {
    const result = await updateTermAction(initialManageTermState, formData(VALID_TERM));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta el período a editar/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (endDate anterior a startDate), sin llamar al backend', async () => {
    const result = await updateTermAction(
      initialManageTermState,
      formData({
        ...VALID_TERM,
        startDate: '2026-07-01',
        endDate: '2026-03-01',
        id: TERM_ID,
      }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve success y llama PATCH a la URL del período', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: TERM_ID }));

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('success');
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/academic-terms/${TERM_ID}`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(VALID_TERM_BODY) }),
    );
  });

  it('404 mapea a universidad o período no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la universidad o el período/i);
    }
  });

  it('409 mapea a período duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe un período con ese año/i);
    }
  });

  it('500 cae al mensaje fallback de edición', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos guardar los cambios/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await updateTermAction(
      initialManageTermState,
      formData({ ...VALID_TERM, id: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});
