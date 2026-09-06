import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de `publishEditorialNoteAction` (ADR-0084). Mocks de borde:
 *   - `@/lib/session`           → fake de getSession para simular el rol admin.
 *   - `@/lib/api-client.server` → controla la Response que recibe la action.
 *
 * Cubrimos el mapeo del problem `reviews.editorial_note.names_a_person`: el nombre sale de
 * `detail` con una regex atada a la forma exacta que arma el backend, y cualquier otro title
 * cae al mapeo genérico existente (NOTE_MESSAGES / fallback), nunca al mensaje de "nombra a".
 */

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api-client.server', () => ({
  apiFetchAuthenticated: vi.fn(),
}));

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { publishEditorialNoteAction } from './actions';
import { initialEditorialNoteState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const CAREER_ID = '00000002-0000-4000-a000-000000000001';

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

function problemResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(ADMIN_SESSION);
});

describe('publishEditorialNoteAction', () => {
  it('cuando el detail trae el nombre en la forma esperada, arma el mensaje con ese nombre', async () => {
    apiFetchMock.mockResolvedValue(
      problemResponse(400, {
        title: 'reviews.editorial_note.names_a_person',
        detail: 'The note names Martín Pérez. A note is published without names.',
      }),
    );

    const result = await publishEditorialNoteAction(
      initialEditorialNoteState,
      formData({ careerId: CAREER_ID, text: 'la cátedra de Martín Pérez no responde nunca' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe(
        'La nota nombra a Martín Pérez. Se publica sin nombres: reescribila sin la persona.',
      );
    }
  });

  it('cuando el detail no matchea la regex, cae al mensaje genérico de "nombra a alguien"', async () => {
    apiFetchMock.mockResolvedValue(
      problemResponse(400, {
        title: 'reviews.editorial_note.names_a_person',
        detail: 'un detail con otra forma que la regex no reconoce',
      }),
    );

    const result = await publishEditorialNoteAction(
      initialEditorialNoteState,
      formData({ careerId: CAREER_ID, text: 'un texto cualquiera' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe(
        'La nota nombra a alguien del catálogo de docentes. Se publica sin nombres: reescribila sin la persona.',
      );
    }
  });

  it('con otro title no cae en ninguno de los mensajes de "nombra a": usa el mapeo genérico', async () => {
    apiFetchMock.mockResolvedValue(
      problemResponse(400, {
        title: 'reviews.editorial_note.text_too_long',
        detail: 'The note is too long.',
      }),
    );

    const result = await publishEditorialNoteAction(
      initialEditorialNoteState,
      formData({ careerId: CAREER_ID, text: 'un texto cualquiera' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('La nota es demasiado larga.');
      expect(result.message).not.toMatch(/nombra a/i);
    }
  });
});
