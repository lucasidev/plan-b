import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del server action que dispara el import de auditorías AGN (issue #506). Mocks de borde:
 *   - `@/lib/session`           → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe el action.
 *
 * Cubre el gate de rol (solo admin), la falla de conexión, el mapeo de cada código de error del
 * backend a un mensaje propio (incluida la trampa del control vacío) y el success con el count.
 */

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { importAgnAuditsAction } from './actions';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

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

describe('importAgnAuditsAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('200 devuelve success con el count', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { auditsLoaded: 5 }));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.auditsLoaded).toBe(5);
    }
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/academic/agn-audits/import',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('401 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('academic.agn_audit.fetch_failed mapea a la AGN caída o tardando', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500, { title: 'academic.agn_audit.fetch_failed' }));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos consultar a la agn/i);
    }
  });

  it('academic.agn_audit.sanity_check_failed mapea al mensaje de la trampa', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(500, { title: 'academic.agn_audit.sanity_check_failed' }),
    );

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no es confiable/i);
    }
  });

  it('academic.agn_audit.incomplete_report mapea al informe incompleto', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(500, { title: 'academic.agn_audit.incomplete_report' }),
    );

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/incompleto/i);
    }
  });

  it('un código desconocido cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500, { title: 'academic.something.else' }));

    const result = await importAgnAuditsAction();

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos actualizar las auditorías/i);
    }
  });
});
