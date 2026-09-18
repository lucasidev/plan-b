import { clientApiFetch } from '@/lib/api-client';
import type { SignOutState } from './types';

/**
 * El browser recibe los Set-Cookie de borrado, incluida la cookie de ruta legacy.
 * El cierre no espera la cola de navegación/RSC de una server action.
 */
export async function signOut(): Promise<SignOutState> {
  try {
    const response = await clientApiFetch('/api/identity/sign-out', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 204) return { status: 'success', redirectTo: '/sign-in' };
  } catch {
    // Un fallo de red no confirma que el servidor haya cerrado la sesión.
  }
  return { status: 'error', message: 'No pudimos cerrar la sesión. Volvé a intentarlo.' };
}
