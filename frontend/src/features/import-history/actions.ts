'use server';

import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { MAX_PAYLOAD_BYTES } from './schema';
import type {
  ConfirmedItem,
  ConfirmHistorialState,
  CreateHistorialImportResponse,
  UploadHistorialState,
} from './types';

/**
 * Upload action: accepts FormData with `file` (PDF) or `rawText`. Dispatches to the
 * backend accordingly and returns the `importId` so the client component can start
 * polling.
 *
 * The backend does all the heavy lifting async; this action just routes.
 */
export async function uploadHistorialAction(
  _prev: UploadHistorialState,
  formData: FormData,
): Promise<UploadHistorialState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
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
    // Rebuild the FormData: the original form may have fields we don't care about;
    // send only the file.
    const upload = new FormData();
    upload.append('file', file);
    response = await apiFetchAuthenticated('/api/me/transcript-imports', {
      method: 'POST',
      body: upload,
    });
  } else if (rawText.trim().length > 0) {
    if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
      return { status: 'error', message: 'El texto supera los 5 MB.' };
    }
    response = await apiFetchAuthenticated('/api/me/transcript-imports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });
  } else {
    return { status: 'error', message: 'Subí un PDF o pegá texto del historial.' };
  }

  if (response.status === 202) {
    const body = (await response.json()) as CreateHistorialImportResponse;
    return { status: 'success', importId: body.id };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message: 'No encontramos tu perfil de estudiante. Volvé a iniciar sesión.',
    };
  }

  if (response.status === 400) {
    // ProblemDetails with detail. If we can't parse, fall back to generic.
    try {
      const problem = (await response.json()) as { detail?: string };
      return {
        status: 'error',
        message: problem.detail ?? 'No pudimos procesar el archivo. Revisalo y reintentá.',
      };
    } catch {
      return {
        status: 'error',
        message: 'No pudimos procesar el archivo. Revisalo y reintentá.',
      };
    }
  }

  return {
    status: 'error',
    message: 'No pudimos iniciar la importación. Intentá de nuevo en un rato.',
  };
}

/**
 * Confirm action: receives the edited items as JSON in a hidden "items" field of the
 * FormData. Goes back to the transcript view on success.
 *
 * Decision: instead of throwing a 400 if some item fails to parse, we ignore the
 * invalid one and ship the valid ones to the backend (the aggregate re-validates them
 * anyway). At the UX level the form already stops the obvious cases.
 */
export async function confirmHistorialAction(
  _prev: ConfirmHistorialState,
  formData: FormData,
): Promise<ConfirmHistorialState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const importId = formData.get('importId')?.toString();
  const itemsJson = formData.get('items')?.toString();
  if (!importId || !itemsJson) {
    return { status: 'error', message: 'Falta información del import.' };
  }

  let items: ConfirmedItem[];
  try {
    items = JSON.parse(itemsJson) as ConfirmedItem[];
  } catch {
    return { status: 'error', message: 'No pudimos leer los items seleccionados.' };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { status: 'error', message: 'Elegí al menos una materia para importar.' };
  }

  const response = await apiFetchAuthenticated(
    `/api/me/transcript-imports/${encodeURIComponent(importId)}/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );

  if (response.status === 200) {
    redirect('/my-career?tab=transcript');
  }

  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos el import.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'El import ya fue confirmado o cambió de estado.' };
  }
  if (response.status === 400) {
    try {
      const problem = (await response.json()) as { detail?: string };
      return {
        status: 'error',
        message: problem.detail ?? 'Revisá los datos de las materias seleccionadas.',
      };
    } catch {
      return { status: 'error', message: 'Revisá los datos de las materias seleccionadas.' };
    }
  }

  return { status: 'error', message: 'No pudimos confirmar el import. Probá de nuevo.' };
}
