'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ProblemDetails } from '@/lib/api-problem';
import { getSession } from '@/lib/session';
import type { DeclareCareerFormState } from './types';

/**
 * Declara la carrera de una cuenta que no la tiene, vía `POST /api/me/student-profiles`.
 *
 * Toda cuenta creada por el registro declara su carrera ahí y su perfil nace al verificar el
 * mail, así que este camino es la excepción y no el flujo: queda para las cuentas que se
 * registraron antes de ADR-0086 y nunca completaron el onboarding retirado. Vive en Mi perfil
 * porque es donde alguien va a buscar sus propios datos, no colgado de otra pantalla.
 *
 * No pide el año de ingreso: ese dato es del hecho que se cuenta, y lo pregunta la primera
 * reseña una sola vez (US-155).
 */
export async function declareCareerAction(
  _prev: DeclareCareerFormState,
  formData: FormData,
): Promise<DeclareCareerFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const careerPlanId = formData.get('careerPlanId')?.toString() ?? '';
  if (!careerPlanId) {
    return { status: 'error', message: 'Elegí tu carrera.' };
  }

  const response = await apiFetchAuthenticated('/api/me/student-profiles', {
    method: 'POST',
    body: JSON.stringify({ careerPlanId }),
  });

  if (response.status === 201) {
    return { status: 'success' };
  }

  if (response.status === 409) {
    // Ya hay un perfil activo: dos pestañas, o nació entre que se cargó la pantalla y se envió.
    // El aggregate admite un solo profile activo por cuenta, sin importar la carrera.
    return { status: 'error', message: 'Ya tenés una carrera declarada. Recargá la página.' };
  }

  if (response.status === 404) {
    // El plan dejó de existir entre que se pintó el picker y el submit. No se arregla
    // reintentando, así que no se ofrece: se pide elegir de nuevo, que es lo que sí sirve.
    const body = (await response.json().catch(() => null)) as ProblemDetails | null;
    if (body?.title === 'identity.student_profile.career_plan_not_found') {
      return {
        status: 'error',
        message: 'Ese plan de estudios ya no está en el catálogo. Elegí otro.',
      };
    }
  }

  if (response.status === 403) {
    return {
      status: 'error',
      message: 'Tu cuenta todavía no está verificada. Revisá el mail que te mandamos.',
    };
  }

  return { status: 'error', message: 'No pudimos guardarla. Probá de nuevo en un rato.' };
}
