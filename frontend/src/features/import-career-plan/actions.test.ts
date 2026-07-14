import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approveCareerPlanAction, uploadCareerPlanAction } from './actions';
import { MAX_PAYLOAD_BYTES } from './schema';
import {
  type ApproveSubjectItem,
  initialApproveCareerPlanState,
  initialUploadCareerPlanState,
} from './types';

/**
 * Tests de los server actions de import-career-plan (US-088). Mocks de borde:
 *   - `@/lib/session`          → fake de getSession para simular session OK / null.
 *   - `@/lib/api-client.server` → controla la Response que recibe cada action.
 *
 * `uploadCareerPlanAction` ramifica multipart (File) vs JSON (rawText); cubrimos cada
 * forma de request más los gates de tamaño (MAX_PAYLOAD_BYTES) y extensión `.pdf`.
 * `approveCareerPlanAction` parsea `items` desde JSON; cubrimos el catch del parse y el
 * gate de array no vacío.
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

const SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'lucia@unsta.edu.ar',
  role: 'member' as const,
};

const BASE_FIELDS = {
  universityId: '11111111-1111-4111-a111-111111111111',
  careerName: 'Ingeniería en Sistemas',
  planYear: '2020',
  studentEnrollmentYear: '2021',
};

function uploadFormData(
  overrides: Record<string, string | undefined> = {},
  file?: File,
  rawText?: string,
): FormData {
  const fd = new FormData();
  const values: Record<string, string> = { ...BASE_FIELDS };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete values[k];
    else values[k] = v;
  }
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  if (file) fd.set('file', file);
  if (rawText !== undefined) fd.set('rawText', rawText);
  return fd;
}

function fakePdfFile(sizeInBytes: number, name = 'plan.pdf'): File {
  const file = new File(['%PDF-1.4 contenido mínimo'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeInBytes });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(SESSION);
});

describe('uploadCareerPlanAction', () => {
  it('devuelve error cuando no hay sesión', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await uploadCareerPlanAction(
      initialUploadCareerPlanState,
      uploadFormData({}, undefined, 'texto del plan'),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando faltan campos base', async () => {
    const result = await uploadCareerPlanAction(
      initialUploadCareerPlanState,
      uploadFormData({ careerName: undefined }, undefined, 'texto del plan'),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/completá universidad/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando ni file ni rawText están presentes', async () => {
    const result = await uploadCareerPlanAction(initialUploadCareerPlanState, uploadFormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/subí un pdf o pegá texto/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  describe('rama multipart (file)', () => {
    it('rechaza un file que supera MAX_PAYLOAD_BYTES sin llamar al backend', async () => {
      const file = fakePdfFile(MAX_PAYLOAD_BYTES + 1);

      const result = await uploadCareerPlanAction(
        initialUploadCareerPlanState,
        uploadFormData({}, file),
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toMatch(/supera los 5 mb/i);
      }
      expect(apiFetchMock).not.toHaveBeenCalled();
    });

    it('rechaza un file sin extensión .pdf sin llamar al backend', async () => {
      const file = fakePdfFile(1024, 'plan.docx');

      const result = await uploadCareerPlanAction(
        initialUploadCareerPlanState,
        uploadFormData({}, file),
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toMatch(/subí un archivo pdf/i);
      }
      expect(apiFetchMock).not.toHaveBeenCalled();
    });

    it('envía multipart/FormData cuando el file es válido y mapea 202 a success', async () => {
      apiFetchMock.mockResolvedValue(
        new Response(JSON.stringify({ id: 'import-1', status: 'Pending' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const file = fakePdfFile(1024);

      const result = await uploadCareerPlanAction(
        initialUploadCareerPlanState,
        uploadFormData({}, file),
      );

      expect(result).toEqual({ status: 'success', importId: 'import-1' });
      const [path, init] = apiFetchMock.mock.calls[0];
      expect(path).toBe('/api/me/career-plan-imports');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeInstanceOf(FormData);
    });
  });

  describe('rama JSON (rawText)', () => {
    it('rechaza un rawText que supera MAX_PAYLOAD_BYTES sin llamar al backend', async () => {
      // Grande vía repeat en vez de guardar 5MB+ literales en el string fuente.
      const rawText = 'a'.repeat(MAX_PAYLOAD_BYTES + 1);

      const result = await uploadCareerPlanAction(
        initialUploadCareerPlanState,
        uploadFormData({}, undefined, rawText),
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.message).toMatch(/el texto supera los 5 mb/i);
      }
      expect(apiFetchMock).not.toHaveBeenCalled();
    });

    it('envía JSON cuando el rawText es válido y mapea 202 a success', async () => {
      apiFetchMock.mockResolvedValue(
        new Response(JSON.stringify({ id: 'import-2', status: 'Pending' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await uploadCareerPlanAction(
        initialUploadCareerPlanState,
        uploadFormData({}, undefined, 'texto del plan de estudios'),
      );

      expect(result).toEqual({ status: 'success', importId: 'import-2' });
      const [path, init] = apiFetchMock.mock.calls[0];
      expect(path).toBe('/api/me/career-plan-imports');
      expect(init?.method).toBe('POST');
      expect(typeof init?.body).toBe('string');
      const parsedBody = JSON.parse(init?.body as string);
      expect(parsedBody.rawText).toBe('texto del plan de estudios');
    });
  });

  it('mapea 404 a "universidad no existe"', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await uploadCareerPlanAction(
      initialUploadCareerPlanState,
      uploadFormData({}, undefined, 'texto del plan'),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no existe en el catálogo/i);
    }
  });

  it('mapea 422 a error de procesamiento', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 422 }));

    const result = await uploadCareerPlanAction(
      initialUploadCareerPlanState,
      uploadFormData({}, undefined, 'texto del plan'),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos procesar el archivo/i);
    }
  });

  it('cae al mensaje genérico cuando el status no matchea ningún caso', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await uploadCareerPlanAction(
      initialUploadCareerPlanState,
      uploadFormData({}, undefined, 'texto del plan'),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos iniciar la importación/i);
    }
  });
});

describe('approveCareerPlanAction', () => {
  const ITEM: ApproveSubjectItem = {
    code: 'ISW301',
    name: 'Ingeniería de Software',
    yearInPlan: 3,
    termInYear: 1,
    termKind: 'Cuatrimestral',
  };

  function approveFormData(overrides: Record<string, string | undefined> = {}): FormData {
    const fd = new FormData();
    const values: Record<string, string> = {
      importId: '11111111-1111-4111-a111-111111111111',
      items: JSON.stringify([ITEM]),
    };
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) delete values[k];
      else values[k] = v;
    }
    for (const [k, v] of Object.entries(values)) fd.set(k, v);
    return fd;
  }

  it('devuelve error cuando no hay sesión', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await approveCareerPlanAction(initialApproveCareerPlanState, approveFormData());

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando falta importId o items', async () => {
    const result = await approveCareerPlanAction(
      initialApproveCareerPlanState,
      approveFormData({ importId: undefined }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta información del import/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando items no es JSON parseable', async () => {
    const result = await approveCareerPlanAction(
      initialApproveCareerPlanState,
      approveFormData({ items: '{not-json' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos leer los items/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando items es un array vacío', async () => {
    const result = await approveCareerPlanAction(
      initialApproveCareerPlanState,
      approveFormData({ items: JSON.stringify([]) }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/elegí al menos una materia/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('devuelve error cuando items no es un array', async () => {
    const result = await approveCareerPlanAction(
      initialApproveCareerPlanState,
      approveFormData({ items: JSON.stringify({ code: 'ISW301' }) }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/elegí al menos una materia/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('mapea 200 a success con los datos del plan aprobado', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ careerPlanId: 'plan-1', careerId: 'career-1', subjectCount: 1 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await approveCareerPlanAction(initialApproveCareerPlanState, approveFormData());

    expect(result).toEqual({
      status: 'success',
      careerPlanId: 'plan-1',
      careerId: 'career-1',
      subjectCount: 1,
    });
  });

  it('mapea 409 al detail del problem cuando existe', async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'ya existe ese plan' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await approveCareerPlanAction(initialApproveCareerPlanState, approveFormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toBe('ya existe ese plan');
    }
  });

  it('cae al mensaje genérico cuando el status no matchea ningún caso', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await approveCareerPlanAction(initialApproveCareerPlanState, approveFormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos confirmar el plan/i);
    }
  });
});
