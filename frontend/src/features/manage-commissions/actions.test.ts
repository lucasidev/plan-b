import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de gestión de comisiones (US-093 admin). Mocks de borde:
 *   - @/lib/session           -> fake de getSession para simular los distintos roles.
 *   - @/lib/api-client.server -> controla la Response que recibe cada action.
 *
 * Cubrimos el gate de rol (solo admin), la falta de ids requeridos (subjectId/termId/id) sin llamar
 * al backend, el mapeo Zod -> mensaje de error, el armado de URL/método/body (incluido el zipeo de
 * los arrays paralelos de docentes y horario), y el mapeo de errores del backend: primero por
 * `title` RFC 7807 (los códigos de negocio específicos), después por status HTTP genérico.
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
  createCommissionAction,
  deactivateCommissionAction,
  reactivateCommissionAction,
  updateCommissionAction,
} from './actions';
import { initialManageCommissionState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const SUBJECT_ID = '00000004-0000-4000-a000-000000000005';
const TERM_ID = '00000005-0000-4000-a000-000000000005';
const COMMISSION_ID = '00000006-0000-4000-a000-000000000001';
const TEACHER_ID = '00000007-0000-4000-a000-000000000001';

/** Forma "string" de los campos, tal cual los manda un <form> (formData siempre son strings). */
const VALID_COMMISSION_FIELDS = {
  name: 'A',
  modality: 'Presencial',
  capacity: '40',
  notes: 'Alguna nota',
  teacherId: [TEACHER_ID],
  teacherRole: ['Lead'],
  scheduleDay: ['Monday'],
  scheduleStart: ['14:00'],
  scheduleEnd: ['16:00'],
};

/** Forma post-Zod (capacity coercionado, docentes/horario zipeados): lo que espera el backend. */
const VALID_COMMISSION_BODY = {
  name: 'A',
  modality: 'Presencial',
  capacity: 40,
  notes: 'Alguna nota',
  teachers: [{ teacherId: TEACHER_ID, role: 'Lead' }],
  schedule: [{ day: 'Monday', start: '14:00', end: '16:00' }],
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

/** Response RFC 7807 con el `title` (código de dominio) que espera cada rama del mapeo. */
function problem(status: number, title: string): Response {
  return jsonResponse(status, { title, detail: 'irrelevante' });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue(ADMIN_SESSION);
});

describe('createCommissionAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin subjectId, sin llamar al backend', async () => {
    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/elegí una materia/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin termId, sin llamar al backend', async () => {
    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta el período/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (nombre vacío), sin llamar al backend', async () => {
    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({
        ...VALID_COMMISSION_FIELDS,
        name: '',
        subjectId: SUBJECT_ID,
        termId: TERM_ID,
      }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida un bloque de horario (fin antes que inicio), sin llamar al backend', async () => {
    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({
        ...VALID_COMMISSION_FIELDS,
        scheduleStart: ['16:00'],
        scheduleEnd: ['14:00'],
        subjectId: SUBJECT_ID,
        termId: TERM_ID,
      }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos, zipeando docentes y horario', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: COMMISSION_ID }));

    await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}/commissions`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ termId: TERM_ID, ...VALID_COMMISSION_BODY }),
      }),
    );
  });

  it('una comisión sin docentes ni horario manda arrays vacíos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: COMMISSION_ID }));

    await createCommissionAction(
      initialManageCommissionState,
      formData({
        name: 'B',
        modality: 'Virtual',
        capacity: '',
        notes: '',
        subjectId: SUBJECT_ID,
        termId: TERM_ID,
      }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}/commissions`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          termId: TERM_ID,
          name: 'B',
          modality: 'Virtual',
          teachers: [],
          schedule: [],
        }),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: COMMISSION_ID }));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('success');
  });

  it('400 genérico (sin title reconocido) mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('400 term_kind_mismatch mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'academic.commission.term_kind_mismatch'));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/cadencia de la materia/i);
    }
  });

  it('400 university_mismatch mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(400, 'academic.commission.university_mismatch'));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/misma universidad/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 subject_not_found mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(problem(404, 'academic.commission.subject_not_found'));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la materia/i);
    }
  });

  it('409 subject_inactive mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.commission.subject_inactive' }),
    );

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/archivada/i);
    }
  });

  it('409 name_already_exists mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.commission.name_already_exists' }),
    );

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe una comisión con ese nombre/i);
    }
  });

  it('409 schedule_overlap mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.commission.schedule_overlap' }),
    );

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/se superponen/i);
    }
  });

  it('409 titular_already_assigned mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.commission.titular_already_assigned' }),
    );

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/titular/i);
    }
  });

  it('409 genérico (sin title reconocido) cae al mensaje de nombre duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe una comisión con ese nombre/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, subjectId: SUBJECT_ID, termId: TERM_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear la comisión/i);
    }
  });
});

describe('updateCommissionAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin id, sin llamar al backend', async () => {
    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData(VALID_COMMISSION_FIELDS),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la comisión a editar/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (modalidad inválida), sin llamar al backend', async () => {
    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, modality: 'Semipresencial', id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve success y llama PUT a la URL de la comisión, sin termId ni subjectId en el body', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: COMMISSION_ID }));

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('success');
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/commissions/${COMMISSION_ID}`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(VALID_COMMISSION_BODY) }),
    );
  });

  it('404 mapea a comisión, materia o período no encontrado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la comisión, la materia o el período/i);
    }
  });

  it('409 name_already_exists mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.commission.name_already_exists' }),
    );

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe una comisión con ese nombre/i);
    }
  });

  it('500 cae al mensaje fallback de edición', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos guardar los cambios/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await updateCommissionAction(
      initialManageCommissionState,
      formData({ ...VALID_COMMISSION_FIELDS, id: COMMISSION_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('deactivateCommissionAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await deactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('llama POST /deactivate y devuelve ok', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: COMMISSION_ID, isActive: false }));

    const result = await deactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/commissions/${COMMISSION_ID}/deactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('409 (ya inactiva) mapea a mensaje de refrescar', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await deactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba en ese estado/i);
    }
  });

  it('404 mapea a comisión no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await deactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la comisión/i);
    }
  });
});

describe('reactivateCommissionAction', () => {
  it('llama POST /reactivate y devuelve ok', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: COMMISSION_ID, isActive: true }));

    const result = await reactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/commissions/${COMMISSION_ID}/reactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await reactivateCommissionAction(COMMISSION_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});
