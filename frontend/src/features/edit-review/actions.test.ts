import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLISH_REVIEW_INITIAL_STATE } from '@/features/write-review/types';

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { editReviewAction } from './actions';

const apiFetchMock = vi.mocked(apiFetchAuthenticated);
const getSessionMock = vi.mocked(getSession);

const REVIEW_ID = '33333333-3333-4333-a333-333333333333';

const VALID_DRAFT = {
  rating: 4,
  difficulty: 3,
  hoursPerWeek: 5,
  text: 'a'.repeat(60),
  teacherText: 'b'.repeat(60),
  tags: [],
  wouldRecommendCourse: true,
  wouldRetakeTeacher: true,
};

function formData(draft: Record<string, unknown> = VALID_DRAFT): FormData {
  const fd = new FormData();
  fd.set('reviewId', REVIEW_ID);
  fd.set('payload', JSON.stringify(draft));
  return fd;
}

function okResponse() {
  return new Response(JSON.stringify({ id: REVIEW_ID }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'lucia@unsta.edu.ar',
    role: 'member',
  });
});

describe('editReviewAction', () => {
  /**
   * El PATCH trata cualquier clave presente como "seteá este valor", y el action manda siempre los
   * dos textos. O sea que el contenido del draft inicial ES el contenido que queda persistido: si
   * la página de edición dejara de sembrar el texto del docente, este PATCH lo borraría sin aviso.
   * Ese acoplamiento no lo fijaba nada.
   */
  it('conserva el texto del docente cuando el alumno solo cambia la dificultad', async () => {
    apiFetchMock.mockResolvedValue(okResponse());

    await editReviewAction(
      PUBLISH_REVIEW_INITIAL_STATE,
      formData({ ...VALID_DRAFT, difficulty: 5 }),
    );

    const [url, init] = apiFetchMock.mock.calls[0];
    expect(url).toBe(`/api/me/reviews/${REVIEW_ID}`);
    expect(init?.method).toBe('PATCH');
    const body = JSON.parse(String(init?.body));
    expect(body.difficultyRating).toBe(5);
    expect(body.teacherText).toBe(VALID_DRAFT.teacherText);
    expect(body.subjectText).toBe(VALID_DRAFT.text);
  });

  /**
   * La otra cara: vaciar el campo a propósito sí tiene que borrarlo. Un string vacío es la señal de
   * "borralo", y por eso el action no lo puede omitir del body.
   */
  it('manda el texto del docente vacío cuando el alumno lo borra', async () => {
    apiFetchMock.mockResolvedValue(okResponse());

    await editReviewAction(
      PUBLISH_REVIEW_INITIAL_STATE,
      formData({ ...VALID_DRAFT, teacherText: '' }),
    );

    const [, init] = apiFetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.teacherText).toBe('');
  });

  it('rechaza sin sesión y sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await editReviewAction(PUBLISH_REVIEW_INITIAL_STATE, formData());

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza un payload que no es JSON parseable, sin llamar al backend', async () => {
    const fd = new FormData();
    fd.set('reviewId', REVIEW_ID);
    fd.set('payload', '{no-json');

    const result = await editReviewAction(PUBLISH_REVIEW_INITIAL_STATE, fd);

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
