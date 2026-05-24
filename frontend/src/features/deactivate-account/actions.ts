'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { DeactivateAccountFormState } from './types';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Deactiva la cuenta del user autenticado (ADR-0044, US-038-bis). Reemplazó al hard delete
 * del flow original (US-038-f). El endpoint backend `/api/me/account` ahora anonimiza la PII
 * (email hasheado, password blank, deactivated_at = now) y borra owned con PII (StudentProfile,
 * verification tokens). Las reseñas futuras del user quedan publicadas como "Ex-miembro".
 *
 * Steps:
 *   1. Leer sesión del JWT cookie. Si no hay (cookie expirada mid-action), surface error en
 *      el modal para que el user re-loguee y reintente. No redirigir: que el user decida.
 *   2. DELETE /api/me/account. El backend invoca el `DeactivateAccountCommand` (no el hard
 *      delete legacy, que ahora vive sin endpoint user-facing).
 *   3. Si 4xx/5xx, surface inline. NO clear cookies en falla (el user sigue logueado).
 *   4. Si 204, clear cookies locales (el backend ya revocó los refresh tokens), redirect a
 *      `/sign-in?account-deactivated=1` para que el banner explique qué pasó.
 *
 * El form-state shape (`DeactivateAccountFormState`) se consume en el componente cliente via
 * `useActionState`. Por regla de Next.js los `'use server'` files solo exportan funciones
 * async, así que el tipo vive en `types.ts`.
 */
export async function deactivateAccountAction(
  _previousState: DeactivateAccountFormState,
  _formData: FormData,
): Promise<DeactivateAccountFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a ingresar y probá otra vez.',
    };
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/account', {
      method: 'DELETE',
      // apiFetchAuthenticated forwardea planb_session (auth del JwtBearer middleware);
      // pasamos planb_refresh como extraCookies porque tiene Path=/api/identity y no
      // se incluiría automáticamente.
      extraCookies: refreshToken ? { [REFRESH_COOKIE]: refreshToken } : undefined,
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (!response.ok) {
    if (response.status === 404) {
      // Caso degenerado: el JWT apunta a un user que ya no existe en DB (post-hard-delete
      // admin, o registro borrado manualmente). Limpiamos cookies y mandamos al banner.
      cookieStore.delete(ACCESS_COOKIE);
      cookieStore.delete(REFRESH_COOKIE);
      redirect('/sign-in?account-deactivated=1');
    }
    if (response.status === 409) {
      // Ya estaba deactivated (idempotency explícita del backend). Trataos como éxito desde
      // el punto de vista del user: limpiamos cookies y vamos al banner.
      cookieStore.delete(ACCESS_COOKIE);
      cookieStore.delete(REFRESH_COOKIE);
      redirect('/sign-in?account-deactivated=1');
    }
    if (response.status === 401) {
      return {
        status: 'error',
        message: 'Tu sesión expiró. Volvé a ingresar y probá otra vez.',
      };
    }
    return {
      status: 'error',
      message: 'No pudimos dar de baja tu cuenta. Probá de nuevo o contactanos.',
    };
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/sign-in?account-deactivated=1');
}
