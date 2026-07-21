import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de los server actions de gestión de materias y correlativas (US-062 admin). Mocks de borde:
 *   - `@/lib/session`           → fake de getSession para simular los distintos roles.
 *   - `@/lib/api-client.server` → controla la Response que recibe cada action.
 *
 * Cubrimos el gate de rol (solo admin), el mapeo Zod → mensaje de error, la falta del id requerido
 * (planId/id/subjectId) sin llamar al backend, el mapeo de cada status HTTP a mensaje (create/update
 * de materia comparten `mapWriteResponse`), el 409 has_dependents del archivado (propaga el listado
 * de materias dependientes) y los dos casos especiales del alta de correlativa (400 cross_plan, 409
 * cycle_detected) con su mensaje específico.
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
  addPrerequisiteAction,
  createSubjectAction,
  deactivateSubjectAction,
  reactivateSubjectAction,
  removePrerequisiteAction,
  updateSubjectAction,
} from './actions';
import { initialManagePrerequisiteState, initialManageSubjectState } from './types';

const getSessionMock = vi.mocked(getSession);
const apiFetchMock = vi.mocked(apiFetchAuthenticated);

const ADMIN_SESSION = {
  userId: '00000000-0000-4000-a000-000000000001',
  email: 'admin@planb.local',
  role: 'admin' as const,
};

const PLAN_ID = '00000004-0000-4000-a000-000000000001';
const SUBJECT_ID = '00000005-0000-4000-a000-000000000001';
const REQUIRED_SUBJECT_ID = '00000005-0000-4000-a000-000000000002';

/** Forma "string" de los campos, tal cual los manda un `<form>` (formData siempre son strings). */
const VALID_SUBJECT = {
  code: 'MAT101',
  name: 'Análisis Matemático I',
  yearInPlan: '1',
  termKind: 'FourMonth',
  termInYear: '1',
  weeklyHours: '8',
  totalHours: '128',
};

/** Forma post-Zod (números coercionados, sin `description` porque quedó vacío): lo que espera el backend. */
const VALID_SUBJECT_BODY = {
  code: 'MAT101',
  name: 'Análisis Matemático I',
  yearInPlan: 1,
  termKind: 'FourMonth',
  termInYear: 1,
  weeklyHours: 8,
  totalHours: 128,
};

const VALID_PREREQUISITE = {
  requiredSubjectId: REQUIRED_SUBJECT_ID,
  type: 'ToEnroll',
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

describe('createSubjectAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol moderator, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin planId, sin llamar al backend', async () => {
    const result = await createSubjectAction(initialManageSubjectState, formData(VALID_SUBJECT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta el plan/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (código vacío), sin llamar al backend', async () => {
    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, code: '', planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida la regla cross-field (anual con termInYear), sin llamar al backend', async () => {
    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, termKind: 'FullYear', termInYear: '1', planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: SUBJECT_ID }));

    await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/career-plans/${PLAN_ID}/subjects`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(VALID_SUBJECT_BODY),
      }),
    );
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201, { id: SUBJECT_ID }));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('success');
  });

  it('400 mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(400));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 mapea a plan o materia no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos el plan o la materia/i);
    }
  });

  it('409 mapea a código duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe una materia con ese código/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await createSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, planId: PLAN_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos crear la materia/i);
    }
  });
});

describe('updateSubjectAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin id, sin llamar al backend', async () => {
    const result = await updateSubjectAction(initialManageSubjectState, formData(VALID_SUBJECT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/falta la materia a editar/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (carga horaria total menor a la semanal), sin llamar al backend', async () => {
    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, weeklyHours: '10', totalHours: '5', id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve success y llama PATCH a la URL de la materia', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: SUBJECT_ID }));

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('success');
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(VALID_SUBJECT_BODY) }),
    );
  });

  it('404 mapea a plan o materia no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos el plan o la materia/i);
    }
  });

  it('409 mapea a código duplicado', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya existe una materia con ese código/i);
    }
  });

  it('500 cae al mensaje fallback de edición', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos guardar los cambios/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await updateSubjectAction(
      initialManageSubjectState,
      formData({ ...VALID_SUBJECT, id: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('deactivateSubjectAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('204 devuelve ok y llama DELETE a la URL de la materia', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(204));

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('404 mapea a materia no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la materia/i);
    }
  });

  it('409 has_dependents propaga el listado de materias dependientes', async () => {
    const dependents = [
      { id: '00000005-0000-4000-a000-000000000003', code: 'BD201', name: 'Bases de Datos' },
      { id: '00000005-0000-4000-a000-000000000004', code: 'EDA201', name: 'Estructuras de Datos' },
    ];
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { code: 'academic.subject.has_dependents', dependents }),
    );

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/otras materias dependen de esta/i);
      expect(result.dependents).toEqual(dependents);
    }
  });

  it('409 sin body válido no rompe: dependents queda undefined', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.dependents).toBeUndefined();
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await deactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('reactivateSubjectAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await reactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('200 devuelve ok y llama POST a reactivate', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(200, { id: SUBJECT_ID, isActive: true }));

    const result = await reactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}/reactivate`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('404 mapea a materia no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await reactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos la materia/i);
    }
  });

  it('409 mapea a "ya estaba activa"', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(409));

    const result = await reactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/ya estaba activa/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await reactivateSubjectAction(SUBJECT_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('addPrerequisiteAction', () => {
  it('rechaza sin sesión, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza a un usuario con rol member, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'member' });

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza sin subjectId, sin llamar al backend', async () => {
    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData(VALID_PREREQUISITE),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/elegí primero la materia/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('rechaza cuando Zod invalida (requiredSubjectId vacío), sin llamar al backend', async () => {
    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, requiredSubjectId: '', subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('arma la URL, el método y el body correctos (subjectId no viaja en el body)', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201));

    await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}/prerequisites`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(VALID_PREREQUISITE),
      }),
    );
  });

  it('201 devuelve success', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(201));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('success');
  });

  // El backend responde con `Results.Problem(title: error.Code, ...)`: el código de dominio viaja
  // en `title` (RFC 7807, ver lib/api-problem.ts), NO en un campo `code`. Estos mocks estaban
  // armados con `{ code }`, un shape que el backend nunca produce, así que el test pasaba mientras
  // la UI real mostraba el mensaje equivocado. Lo cazó el E2E contra el backend de verdad.
  it('400 con title cross_plan mapea a mensaje específico', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(400, { title: 'academic.prerequisite.cross_plan' }),
    );

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/mismo plan de estudios/i);
    }
  });

  it('400 genérico mapea a mensaje de datos inválidos', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(400, { code: 'academic.prerequisite.self_reference' }),
    );

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/revisá los datos/i);
    }
  });

  it('401 mapea a sesión expirada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(401));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('404 mapea a materia no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no encontramos la materia/i);
    }
  });

  it('409 con title cycle_detected mapea a mensaje claro de ciclo', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { title: 'academic.prerequisite.cycle_detected' }),
    );

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ciclo/i);
      expect(result.message).not.toMatch(/no pudimos agregar la correlativa\. probá de nuevo\./i);
    }
  });

  it('409 sin cycle_detected mapea a correlativa ya cargada', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse(409, { code: 'academic.prerequisite.already_exists' }),
    );

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/ya está cargada/i);
    }
  });

  it('500 cae al mensaje fallback', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(500));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos agregar la correlativa/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await addPrerequisiteAction(
      initialManagePrerequisiteState,
      formData({ ...VALID_PREREQUISITE, subjectId: SUBJECT_ID }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});

describe('removePrerequisiteAction', () => {
  it('rechaza a un usuario sin rol admin, sin llamar al backend', async () => {
    getSessionMock.mockResolvedValue({ ...ADMIN_SESSION, role: 'moderator' });

    const result = await removePrerequisiteAction(SUBJECT_ID, REQUIRED_SUBJECT_ID, 'ToEnroll');

    expect(result.ok).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('204 devuelve ok y llama DELETE a la URL de la correlativa', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(204));

    const result = await removePrerequisiteAction(SUBJECT_ID, REQUIRED_SUBJECT_ID, 'ToTakeFinal');

    expect(result.ok).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/api/academic/subjects/${SUBJECT_ID}/prerequisites/${REQUIRED_SUBJECT_ID}/ToTakeFinal`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('404 mapea a correlativa no encontrada', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(404));

    const result = await removePrerequisiteAction(SUBJECT_ID, REQUIRED_SUBJECT_ID, 'ToEnroll');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no encontramos esa correlativa/i);
    }
  });

  it('403 mapea a sin permisos', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(403));

    const result = await removePrerequisiteAction(SUBJECT_ID, REQUIRED_SUBJECT_ID, 'ToEnroll');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no tenés permisos/i);
    }
  });

  it('devuelve error cuando falla la conexión', async () => {
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await removePrerequisiteAction(SUBJECT_ID, REQUIRED_SUBJECT_ID, 'ToEnroll');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });
});
