'use server';

import type { ProblemDetails } from '@/lib/api-problem';
import { forwardSetCookies } from '@/lib/forward-set-cookies';
import { sanitizeInternalRedirect } from '@/lib/internal-redirect';
import { roleHomePath } from '@/lib/role-home-path';
import { normalizeRole } from '@/lib/session';
import { signIn } from './api';
import { signInSchema } from './schema';
import type { SignInFormState, SignInUserPayload } from './types';

/**
 * Sign-in server action. Validates with signInSchema, calls
 * POST /api/identity/sign-in, forwards Set-Cookie headers (planb_session,
 * planb_refresh) on 200, then redirects to wherever that rol entra.
 *
 * Per frontend/CLAUDE.md, this file is `'use server'` at the top so it
 * can only export async functions. Types and the initial state live in
 * ./types.
 */
// react-doctor-disable-next-line server-auth-actions, react-doctor/server-auth-actions -- sign-in is the auth entry point, must be public
export async function signInAction(
  _prev: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      kind: 'unknown',
      message: parsed.error.issues[0].message,
      email: raw.email,
    };
  }

  // El campo oculto lo puso la propia pantalla de Ingresar a partir de su query string, pero
  // sigue siendo entrada del cliente (se puede editar el DOM antes de enviar): se vuelve a
  // sanitizar acá, en vez de confiar en que ya vino limpio (US-229).
  const from = sanitizeInternalRedirect(formData.get('from')?.toString());

  const response = await signIn({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (response.status === 200) {
    // El destino sale del rol, no de una constante: `/home` es solo el del alumno, y mandar
    // ahí a cualquier otro lo deja rebotando entre el guard de `(member)` y el de `(auth)`.
    const payload = (await response.json().catch(() => null)) as SignInUserPayload | null;
    const role = payload?.role ? normalizeRole(payload.role) : null;

    if (!role) {
      // El backend autenticó, pero el rol no tiene ninguna pantalla en el producto de hoy.
      // Las cookies NO se reenvían: dejarlas puestas produce una cuenta fantasma, que entra
      // bien y a la que después ningún guard reconoce, sin decir nunca por qué.
      return {
        status: 'error',
        kind: 'unknown',
        message: 'Esa cuenta no tiene acceso a la aplicación.',
        email: parsed.data.email,
      };
    }

    await forwardSetCookies(response);
    // Con un `from` sano, vuelve exactamente a lo que estaba haciendo; si no vino de ninguna
    // acción (o el valor no pasó la sanitización), al lugar por defecto de su rol (US-229, E2/E3).
    return { status: 'success', redirectTo: from ?? roleHomePath(role) };
  }

  if (response.status === 401) {
    // ADR-0076: el backend responde 401 tanto para credenciales malas como para una cuenta
    // sin verificar, para no revelar que el mail tiene cuenta. Por eso el reenvío de
    // verificación cuelga de acá, del mensaje que ve todo el mundo, con el email que la
    // persona ya tipeó (echoarlo a su propio cliente no agrega información).
    return {
      status: 'error',
      kind: 'invalid_credentials',
      message: 'El mail o la contraseña no coinciden.',
      email: parsed.data.email,
    };
  }

  if (response.status === 403) {
    const body = (await response.json().catch(() => null)) as ProblemDetails | null;
    const code = body?.title ?? '';
    if (code === 'identity.account.disabled') {
      return {
        status: 'error',
        kind: 'account_disabled',
        message:
          'Tu cuenta fue suspendida. Contactá al equipo de moderación si creés que es un error.',
        email: parsed.data.email,
      };
    }
    return {
      status: 'error',
      kind: 'unknown',
      message: body?.detail ?? 'No podemos iniciar sesión con esa cuenta.',
      email: parsed.data.email,
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos iniciar sesión. Probá de nuevo en un rato.',
    email: parsed.data.email,
  };
}
