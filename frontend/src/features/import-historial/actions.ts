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
 * Action del upload: acepta FormData con `file` (PDF) o `rawText`. Despacha al
 * backend según corresponda y devuelve el `importId` para que el client component
 * arranque el polling.
 *
 * El backend hace todo el trabajo pesado async; este action solo enrouta.
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
    // Re-armado del FormData: el form original puede tener fields que no nos
    // interesan, mandamos solo el file.
    const upload = new FormData();
    upload.append('file', file);
    response = await apiFetchAuthenticated('/api/me/historial-imports', {
      method: 'POST',
      body: upload,
    });
  } else if (rawText.trim().length > 0) {
    if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
      return { status: 'error', message: 'El texto supera los 5 MB.' };
    }
    response = await apiFetchAuthenticated('/api/me/historial-imports', {
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
    // ProblemDetails con detail. Si no podemos parsear, fallback genérico.
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
 * Action del confirm: recibe los items editados como JSON en un hidden field
 * "items" del FormData. Devuelve al historial al éxito.
 *
 * Decisión: en vez de gritar 400 si algún item no parsea, ignoramos el inválido
 * y mandamos los válidos al backend (el aggregate los re-valida igual). Pero
 * a nivel UX el form ya frena los obvios.
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
    `/api/me/historial-imports/${encodeURIComponent(importId)}/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );

  if (response.status === 200) {
    redirect('/mi-carrera?tab=historial');
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
