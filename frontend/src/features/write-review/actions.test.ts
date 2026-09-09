import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publishReviewAction } from './actions';
import { initialPublishState } from './types';

/**
 * Tests de `publishReviewAction` (US-146, ADR-0082). Mocks de borde:
 *   - `@/lib/api-client` → controla la Response que recibe el action. `apiFetchAuthenticated`
 *     (de `@/lib/api-client.server`) delega en `apiFetch` de este módulo para el request en sí,
 *     así que mockearlo alcanza sin tocar `next/headers`: fuera de un request real, `cookies()`
 *     tira y `apiFetchAuthenticated` ya degrada a pedir sin cookie (comentario en el propio
 *     archivo), que es exactamente lo que pasa acá bajo vitest.
 *   - `@/lib/session` → fake de `getSession` para simular sesión vigente o expirada.
 *
 * Cubre las ramas del action (sin sesión, payload ausente, JSON inválido, falla de schema, 201,
 * 409, 401, cualquier otro status) y el shape exacto que viaja al backend: el mapeo de
 * `answers` a pares `itemCode`/`optionValue` y el recorte de `freeText`.
 */

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';

const apiFetchMock = vi.mocked(apiFetch);
const getSessionMock = vi.mocked(getSession);

const SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'lucia@unsta.edu.ar',
  role: 'member' as const,
};

const VALID_PAYLOAD = {
  subjectId: '11111111-1111-1111-1111-111111111111',
  termId: '22222222-2222-2222-2222-222222222222',
  chairId: null,
  answers: { 'kept-pace': 1 },
  freeText: null,
};

function formDataWith(payload: unknown) {
  const formData = new FormData();
  formData.set('payload', JSON.stringify(payload));
  return formData;
}

function requestBodyOf(mock: typeof apiFetchMock) {
  const [, init] = mock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(SESSION);
});

describe('publishReviewAction', () => {
  it('sin sesión, devuelve el error de sesión expirada sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await publishReviewAction(initialPublishState, formDataWith(VALID_PAYLOAD));

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'Tu sesión expiró. Volvé a iniciar sesión.',
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('sin el campo payload en el formulario, devuelve "Faltan datos del formulario."', async () => {
    const result = await publishReviewAction(initialPublishState, new FormData());

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'Faltan datos del formulario.',
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('con payload que no es JSON válido, devuelve el error de lectura', async () => {
    const formData = new FormData();
    formData.set('payload', '{esto no es json');

    const result = await publishReviewAction(initialPublishState, formData);

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'No pudimos leer lo que respondiste. Probá de nuevo.',
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('con payload que no pasa el schema, devuelve el primer mensaje del schema', async () => {
    const result = await publishReviewAction(
      initialPublishState,
      formDataWith({ ...VALID_PAYLOAD, subjectId: '' }),
    );

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'Elegí la materia que cursaste.',
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('201 devuelve success con el id y el conteo de respuestas que manda el backend', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'review-1', answeredItems: 3 }), { status: 201 }),
    );

    const result = await publishReviewAction(initialPublishState, formDataWith(VALID_PAYLOAD));

    expect(result).toEqual({ status: 'success', reviewId: 'review-1', answeredItems: 3 });
  });

  it('US-163: 409 (ya reseñada) devuelve kind: duplicate con el mensaje que manda a Mis aportes', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 409 }));

    const result = await publishReviewAction(initialPublishState, formDataWith(VALID_PAYLOAD));

    expect(result).toEqual({
      status: 'error',
      kind: 'duplicate',
      message: 'Ya reseñaste esta cursada. Podés editar la que tenés desde Mis aportes.',
    });
  });

  it('401 del backend también devuelve el error de sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const result = await publishReviewAction(initialPublishState, formDataWith(VALID_PAYLOAD));

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'Tu sesión expiró. Volvé a iniciar sesión.',
    });
  });

  it('cualquier otro status devuelve el error genérico de guardado', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await publishReviewAction(initialPublishState, formDataWith(VALID_PAYLOAD));

    expect(result).toEqual({
      status: 'error',
      kind: 'unknown',
      message: 'No pudimos guardar tu reseña. Probá de nuevo en un rato.',
    });
  });

  it('manda subjectId, termId, chairId y answers como pares itemCode/optionValue, en orden', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'r', answeredItems: 2 }), { status: 201 }),
    );

    await publishReviewAction(
      initialPublishState,
      formDataWith({
        ...VALID_PAYLOAD,
        chairId: '33333333-3333-3333-3333-333333333333',
        answers: { COURSE_OUTCOME: 1, 'kept-pace': 2 },
      }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/reviews/courses',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(requestBodyOf(apiFetchMock)).toEqual({
      subjectId: VALID_PAYLOAD.subjectId,
      termId: VALID_PAYLOAD.termId,
      chairId: '33333333-3333-3333-3333-333333333333',
      answers: [
        { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
        { itemCode: 'kept-pace', optionValue: 2 },
      ],
      freeText: null,
    });
  });

  it('freeText nulo viaja como null', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'r', answeredItems: 1 }), { status: 201 }),
    );

    await publishReviewAction(
      initialPublishState,
      formDataWith({ ...VALID_PAYLOAD, freeText: null }),
    );

    expect(requestBodyOf(apiFetchMock).freeText).toBeNull();
  });

  it('freeText de solo espacios viaja como null, no como cadena vacía', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'r', answeredItems: 1 }), { status: 201 }),
    );

    await publishReviewAction(
      initialPublishState,
      formDataWith({ ...VALID_PAYLOAD, freeText: '   ' }),
    );

    expect(requestBodyOf(apiFetchMock).freeText).toBeNull();
  });

  it('freeText con espacios alrededor viaja recortado', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'r', answeredItems: 1 }), { status: 201 }),
    );

    await publishReviewAction(
      initialPublishState,
      formDataWith({ ...VALID_PAYLOAD, freeText: '  no vimos el programa  ' }),
    );

    expect(requestBodyOf(apiFetchMock).freeText).toBe('no vimos el programa');
  });
});
