import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publishReviewAction } from './actions';
import { PUBLISH_REVIEW_INITIAL_STATE } from './types';

/**
 * Tests del server action `publishReviewAction` (US-049/US-048/US-065). Mocks de borde:
 *   - `@/lib/session`          → fake de getSession para simular session OK / null.
 *   - `@/lib/api-client.server` → controla la Response que recibe el action.
 *
 * Cubrimos las guardas pre-fetch (no pegan al backend si fallan):
 *   - falta docenteResenadoId
 *   - JSON.parse del payload con catch
 *   - gate de "texto requerido" (el schema deja el texto opcional, el action lo exige)
 * y un happy path 201 para confirmar que un input completo atraviesa las tres guardas.
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

const VALID_DRAFT = {
  rating: 4,
  difficulty: 3,
  hoursPerWeek: 5,
  text: 'a'.repeat(60),
  tags: [],
  wouldRecommendCourse: true,
  wouldRetakeTeacher: true,
};

function formData(overrides: Record<string, string | undefined> = {}): FormData {
  const fd = new FormData();
  const values: Record<string, string> = {
    enrollmentId: '11111111-1111-4111-a111-111111111111',
    docenteResenadoId: '22222222-2222-4222-a222-222222222222',
    payload: JSON.stringify(VALID_DRAFT),
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete values[k];
    else values[k] = v;
  }
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'lucia@unsta.edu.ar',
    role: 'member',
  });
});

describe('publishReviewAction', () => {
  it('rechaza cuando falta docenteResenadoId, sin llamar al backend', async () => {
    const result = await publishReviewAction(
      PUBLISH_REVIEW_INITIAL_STATE,
      formData({ docenteResenadoId: undefined }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('Elegí el docente que te dio la cursada.');
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando el payload no es JSON parseable, sin llamar al backend', async () => {
    const result = await publishReviewAction(
      PUBLISH_REVIEW_INITIAL_STATE,
      formData({ payload: '{not-json' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('No pude leer el formulario.');
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando el draft no trae texto (gate de "texto requerido"), sin llamar al backend', async () => {
    const draftSinTexto = { ...VALID_DRAFT, text: undefined };
    const result = await publishReviewAction(
      PUBLISH_REVIEW_INITIAL_STATE,
      formData({ payload: JSON.stringify(draftSinTexto) }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe(
        'Escribí tu experiencia (mínimo 50 caracteres) antes de publicar.',
      );
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('atraviesa las tres guardas y publica cuando el input está completo (201)', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'review-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await publishReviewAction(PUBLISH_REVIEW_INITIAL_STATE, formData());

    expect(result).toEqual({ status: 'success', reviewId: 'review-1' });
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
