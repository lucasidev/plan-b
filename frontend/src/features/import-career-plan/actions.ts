'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { MAX_PAYLOAD_BYTES } from './schema';
import type {
  ApproveCareerPlanImportResponse,
  ApproveCareerPlanState,
  ApproveSubjectItem,
  CreateCareerPlanImportResponse,
  UploadCareerPlanState,
} from './types';

/**
 * Upload del PDF o texto del plan. Acepta multipart o JSON según haya file o solo rawText.
 * Mismo patrón que el upload del historial (US-014).
 */
export async function uploadCareerPlanAction(
  _prev: UploadCareerPlanState,
  formData: FormData,
): Promise<UploadCareerPlanState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const universityId = formData.get('universityId')?.toString();
  const careerName = formData.get('careerName')?.toString();
  const planYearRaw = formData.get('planYear')?.toString();
  const enrollmentYearRaw = formData.get('studentEnrollmentYear')?.toString();

  if (!universityId || !careerName || !planYearRaw || !enrollmentYearRaw) {
    return {
      status: 'error',
      message: 'Completá universidad, carrera, año del plan y año de ingreso.',
    };
  }

  const file = formData.get('file');
  const rawText = formData.get('rawText')?.toString() ?? '';

  let response: Response;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PAYLOAD_BYTES) {
      return { status: 'error', message: 'El archivo supera los 5 MB.' };
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { status: 'error', message: 'Subí un archivo PDF.' };
    }
    const upload = new FormData();
    upload.append('file', file);
    upload.append('universityId', universityId);
    upload.append('careerName', careerName);
    upload.append('planYear', planYearRaw);
    upload.append('studentEnrollmentYear', enrollmentYearRaw);
    response = await apiFetchAuthenticated('/api/me/career-plan-imports', {
      method: 'POST',
      body: upload,
    });
  } else if (rawText.trim().length > 0) {
    if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
      return { status: 'error', message: 'El texto supera los 5 MB.' };
    }
    response = await apiFetchAuthenticated('/api/me/career-plan-imports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        universityId,
        careerName,
        planYear: Number.parseInt(planYearRaw, 10),
        studentEnrollmentYear: Number.parseInt(enrollmentYearRaw, 10),
        rawText,
      }),
    });
  } else {
    return { status: 'error', message: 'Subí un PDF o pegá texto del plan.' };
  }

  if (response.status === 202) {
    const body = (await response.json()) as CreateCareerPlanImportResponse;
    return { status: 'success', importId: body.id };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message: 'La universidad seleccionada no existe en el catálogo.',
    };
  }

  if (response.status === 413) {
    return { status: 'error', message: 'El archivo supera los 5 MB.' };
  }

  if (response.status === 422) {
    return {
      status: 'error',
      message: 'No pudimos procesar el archivo (PDF protegido o inválido).',
    };
  }

  if (response.status === 400) {
    try {
      const problem = (await response.json()) as { detail?: string };
      return {
        status: 'error',
        message: problem.detail ?? 'No pudimos procesar el archivo. Revisalo y reintentá.',
      };
    } catch {
      return { status: 'error', message: 'No pudimos procesar el archivo. Revisalo y reintentá.' };
    }
  }

  return {
    status: 'error',
    message: 'No pudimos iniciar la importación. Intentá de nuevo en un rato.',
  };
}

/**
 * Approve del preview. El frontend manda los items (con eventuales overrides). Al éxito
 * devuelve careerPlanId que el caller usa para redirigir al onboarding/career con
 * `?planId=X` y autocompletar.
 */
export async function approveCareerPlanAction(
  _prev: ApproveCareerPlanState,
  formData: FormData,
): Promise<ApproveCareerPlanState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const importId = formData.get('importId')?.toString();
  const itemsJson = formData.get('items')?.toString();
  if (!importId || !itemsJson) {
    return { status: 'error', message: 'Falta información del import.' };
  }

  let items: ApproveSubjectItem[];
  try {
    items = JSON.parse(itemsJson) as ApproveSubjectItem[];
  } catch {
    return { status: 'error', message: 'No pudimos leer los items seleccionados.' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { status: 'error', message: 'Elegí al menos una materia para crear el plan.' };
  }

  const response = await apiFetchAuthenticated(
    `/api/me/career-plan-imports/${encodeURIComponent(importId)}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );

  if (response.status === 200) {
    const body = (await response.json()) as ApproveCareerPlanImportResponse;
    return {
      status: 'success',
      careerPlanId: body.careerPlanId,
      careerId: body.careerId,
      subjectCount: body.subjectCount,
    };
  }

  if (response.status === 409) {
    try {
      const problem = (await response.json()) as { detail?: string };
      return {
        status: 'error',
        message:
          problem.detail ??
          'Ya existe un plan con esa carrera y año. Cambiá el año o usá el existente.',
      };
    } catch {
      return {
        status: 'error',
        message: 'Ya existe un plan con esa carrera y año.',
      };
    }
  }

  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos el import.' };
  }

  if (response.status === 400) {
    try {
      const problem = (await response.json()) as { detail?: string };
      return {
        status: 'error',
        message: problem.detail ?? 'Revisá los datos antes de aprobar.',
      };
    } catch {
      return { status: 'error', message: 'Revisá los datos antes de aprobar.' };
    }
  }

  return { status: 'error', message: 'No pudimos confirmar el plan. Probá de nuevo.' };
}
