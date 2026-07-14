import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveReportAction } from './actions';

/**
 * Tests del server action `resolveReportAction` (US-051). Mocks de borde:
 *   - `@/lib/session`          → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe el action.
 *
 * Cubrimos el gate de rol (`isStaff`, sólo moderator/admin pueden resolver), el gate de
 * longitud de la nota (MAX_NOTE = 1000) y el flag `conflict: true` en el 409 (otro
 * moderador ganó la race).
 */

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const REPORT_ID = '11111111-1111-4111-a111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveReportAction: gate de rol (isStaff)', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await resolveReportAction(REPORT_ID, 'dismiss', '');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000001',
      email: 'lucia@unsta.edu.ar',
      role: 'member',
    });

    const result = await resolveReportAction(REPORT_ID, 'dismiss', '');

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('permite a un usuario con rol moderator', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000002',
      email: 'mod@unsta.edu.ar',
      role: 'moderator',
    });
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ cascadedCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await resolveReportAction(REPORT_ID, 'dismiss', '');

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalled();
  });

  it('permite a un usuario con rol admin', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000003',
      email: 'admin@unsta.edu.ar',
      role: 'admin',
    });
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ cascadedCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await resolveReportAction(REPORT_ID, 'uphold', '');

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalled();
  });
});

describe('resolveReportAction: gate de longitud de la nota (MAX_NOTE)', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000002',
      email: 'mod@unsta.edu.ar',
      role: 'moderator',
    });
  });

  it('rechaza una nota de más de 1000 caracteres, sin llamar al backend', async () => {
    const result = await resolveReportAction(REPORT_ID, 'uphold', 'a'.repeat(1001));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no puede superar los 1000 caracteres/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('acepta una nota de exactamente 1000 caracteres', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ cascadedCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await resolveReportAction(REPORT_ID, 'uphold', 'a'.repeat(1000));

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalled();
  });
});

describe('resolveReportAction: flag conflict en 409', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000002',
      email: 'mod@unsta.edu.ar',
      role: 'moderator',
    });
  });

  it('marca conflict: true cuando el backend responde 409', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 409 }));

    const result = await resolveReportAction(REPORT_ID, 'dismiss', '');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict).toBe(true);
      expect(result.message).toMatch(/ya lo resolvió otro moderador/i);
    }
  });

  it('no marca conflict en otros errores (ej. 404)', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await resolveReportAction(REPORT_ID, 'dismiss', '');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict).toBeUndefined();
    }
  });
});
