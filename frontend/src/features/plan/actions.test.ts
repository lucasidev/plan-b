import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de borradores (US-023). Mocks de borde:
 *   - @/lib/session           -> fake de getSession para simular sesión / sin sesión.
 *   - @/lib/api-client.server -> controla la Response que recibe cada action.
 *
 * Cubrimos el gate de sesión, el armado de URL/método/body, el mapeo por `title` RFC 7807 de cada
 * código de negocio (`items_required`, `duplicate_subject`, `label_too_long`, `subject_not_in_plan`,
 * `not_found`, `not_owner`, `cannot_promote`, `rate_limit_exceeded`, `student_profile_required`) y
 * el fallback por status HTTP genérico.
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
  createSimulationDraftAction,
  deleteSimulationDraftAction,
  promoteSimulationDraftAction,
  updateSimulationDraftAction,
} from './actions';
import type { CommissionSelection } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const STUDENT_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'student@planb.local',
  role: 'member' as const,
};

const TERM_ID = '00000005-0000-4000-a000-000000000005';
const DRAFT_ID = '00000006-0000-4000-a000-000000000001';
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005';
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001';

const ITEMS: CommissionSelection[] = [{ subjectId: SUBJECT_ID, commissionId: COMMISSION_ID }];

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

/** Response RFC 7807 con el `title` (código de dominio) que espera cada rama del mapeo. */
function problem(status: number, title: string): Response {
  return jsonResponse(status, { title, detail: 'irrelevante' });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(STUDENT_SESSION);
});

describe('createSimulationDraftAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createSimulationDraftAction(TERM_ID, 'Mi borrador', ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: DRAFT_ID }));

    await createSimulationDraftAction(TERM_ID, 'Mi borrador', ITEMS);

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/me/simulations/drafts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          termId: TERM_ID,
          label: 'Mi borrador',
          items: [{ subjectId: SUBJECT_ID, commissionId: COMMISSION_ID }],
        }),
      }),
    );
  });

  it('label null viaja tal cual (borrador sin nombre)', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: DRAFT_ID }));

    await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/me/simulations/drafts',
      expect.objectContaining({
        body: JSON.stringify({
          termId: TERM_ID,
          label: null,
          items: [{ subjectId: SUBJECT_ID, commissionId: COMMISSION_ID }],
        }),
      }),
    );
  });

  it('201 devuelve success con el id creado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: DRAFT_ID }));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result).toEqual({ status: 'success', id: DRAFT_ID });
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('400 items_required mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'planning.simulation_draft.items_required'));

    const result = await createSimulationDraftAction(TERM_ID, null, []);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/al menos una materia/i);
    }
  });

  it('400 duplicate_subject mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'planning.simulation_draft.duplicate_subject'));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/aparecer dos veces/i);
    }
  });

  it('400 label_too_long mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'planning.simulation_draft.label_too_long'));

    const result = await createSimulationDraftAction(TERM_ID, 'x'.repeat(200), ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/nombre del borrador es demasiado largo/i);
    }
  });

  it('400 subject_not_in_plan mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'planning.simulation_draft.subject_not_in_plan'));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pertenece a tu plan/i);
    }
  });

  it('404 student_profile_required mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(404, 'planning.simulator.student_profile_required'));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos tu perfil de alumno/i);
    }
  });

  it('429 mapea al mensaje de límite de guardados', async () => {
    apiFetchMock.mockResolvedValue(problem(429, 'planning.simulation_draft.rate_limit_exceeded'));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/límite de guardados por hora/i);
    }
  });

  it('429 sin title reconocido igual mapea al límite de guardados (fallback por status)', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(429));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/límite de guardados por hora/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createSimulationDraftAction(TERM_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos guardar el borrador/i);
    }
  });
});

describe('updateSimulationDraftAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateSimulationDraftAction(DRAFT_ID, 'x', ITEMS);

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma PATCH a la URL del borrador, sin termId en el body', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: DRAFT_ID }));

    await updateSimulationDraftAction(DRAFT_ID, 'Editado', ITEMS);

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/me/simulations/drafts/${DRAFT_ID}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          label: 'Editado',
          items: [{ subjectId: SUBJECT_ID, commissionId: COMMISSION_ID }],
        }),
      }),
    );
  });

  it('200 devuelve success con el id editado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: DRAFT_ID }));

    const result = await updateSimulationDraftAction(DRAFT_ID, null, ITEMS);

    expect(result).toEqual({ status: 'success', id: DRAFT_ID });
  });

  it('404 not_found mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(404, 'planning.simulation_draft.not_found'));

    const result = await updateSimulationDraftAction(DRAFT_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos ese borrador/i);
    }
  });

  it('403 not_owner mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(403, 'planning.simulation_draft.not_owner'));

    const result = await updateSimulationDraftAction(DRAFT_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no te pertenece/i);
    }
  });

  it('404 genérico (sin title reconocido) cae al mensaje de borrador no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateSimulationDraftAction(DRAFT_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos ese borrador/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await updateSimulationDraftAction(DRAFT_ID, null, ITEMS);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('deleteSimulationDraftAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await deleteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('llama DELETE a la URL del borrador y 204 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(204));

    const result = await deleteSimulationDraftAction(DRAFT_ID);

    expect(result).toEqual({ status: 'success' });
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/me/simulations/drafts/${DRAFT_ID}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('403 not_owner mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(403, 'planning.simulation_draft.not_owner'));

    const result = await deleteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no te pertenece/i);
    }
  });

  it('404 not_found mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(404, 'planning.simulation_draft.not_found'));

    const result = await deleteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos ese borrador/i);
    }
  });
});

describe('promoteSimulationDraftAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('llama POST /promote y 200 devuelve success con el status resultante', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: DRAFT_ID, status: 'Active' }));

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result).toEqual({ status: 'success', draftStatus: 'Active' });
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/me/simulations/drafts/${DRAFT_ID}/promote`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('409 cannot_promote mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(409, 'planning.simulation_draft.cannot_promote'));

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya no se puede publicar/i);
    }
  });

  it('403 not_owner mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(403, 'planning.simulation_draft.not_owner'));

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no te pertenece/i);
    }
  });

  it('404 not_found mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(404, 'planning.simulation_draft.not_found'));

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos ese borrador/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await promoteSimulationDraftAction(DRAFT_ID);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});
