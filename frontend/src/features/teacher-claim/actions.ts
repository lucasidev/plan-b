'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { ClaimFormState, EmailFormState, VerifyResult } from './types';

/**
 * Server action de iniciar claim docente (US-030). POST /api/me/teacher-claims con el teacherId.
 *
 * Mutación pura (ADR-0046): devuelve `{ status }` sin `revalidatePath`/`redirect`. El componente
 * reacciona al `status: 'success'` haciendo `router.refresh()` para re-renderizar la página server
 * (re-fetch de los claims) y limpiar la búsqueda.
 */
export async function initiateTeacherClaimAction(
  _prev: ClaimFormState,
  formData: FormData,
): Promise<ClaimFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const teacherId = formData.get('teacherId')?.toString();
  if (!teacherId) {
    return { status: 'error', message: 'Elegí un docente para reclamar.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/teacher-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId }),
    });
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.status === 201) {
    return { status: 'success', teacherId };
  }
  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ya reclamaste este docente.' };
  }
  if (response.status === 410) {
    return { status: 'error', message: 'Ese docente ya no está disponible.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos ese docente.' };
  }
  if (response.status === 403) {
    return { status: 'error', message: 'Tu cuenta no puede reclamar identidad docente.' };
  }
  return { status: 'error', message: 'No pudimos iniciar el reclamo. Probá de nuevo en un rato.' };
}

/**
 * US-031 paso 1: enviar el email institucional de un claim. POST .../{id}/institutional-email. Si el
 * dominio pertenece a la universidad del docente, el backend manda un mail con el link de verificación.
 * Mutación pura (ADR-0046): la card reacciona al success haciendo router.refresh().
 */
export async function submitInstitutionalEmailAction(
  _prev: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const claimId = formData.get('claimId')?.toString();
  const email = formData.get('email')?.toString();
  if (!claimId || !email) {
    return { status: 'error', message: 'Ingresá tu email institucional.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(
      `/api/me/teacher-claims/${claimId}/institutional-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    );
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.status === 202) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return {
      status: 'error',
      message: 'Ese email no es de tu universidad. Usá tu email institucional.',
    };
  }
  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 403) {
    return { status: 'error', message: 'Ese reclamo no es tuyo.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos el reclamo.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ese reclamo ya está verificado.' };
  }
  return {
    status: 'error',
    message: 'No pudimos enviar la verificación. Probá de nuevo en un rato.',
  };
}

/**
 * US-031 paso 2: consumir el token del link de mail. POST .../verify. Se llama desde la página
 * /verify-teacher de forma programática (no desde un form), así que toma el token directo.
 */
export async function verifyTeacherClaim(token: string): Promise<VerifyResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'unauthenticated' };
  }
  if (!token) {
    return { status: 'error', message: 'El link no trae un token válido.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/teacher-claims/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 401) {
    return { status: 'unauthenticated' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'El link es inválido o ya expiró. Pedí uno nuevo.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Este docente ya fue verificado por otra persona.' };
  }
  return { status: 'error', message: 'No pudimos verificar tu cuenta. Probá de nuevo en un rato.' };
}
