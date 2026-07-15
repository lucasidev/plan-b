/**
 * DTOs del backoffice de universidades (US-060 admin). Espejan los responses del backend:
 *  - Listado admin: GET /api/academic/universities/admin (activas + inactivas, gateado a rol admin)
 *  - Detalle para el form de edición: GET /api/academic/universities/{id} (admin, incluye isActive)
 *
 * A diferencia del backoffice de docentes, acá no hace falta un DTO de "opciones para un select":
 * la universidad no referencia a otra entidad en su alta/edición.
 */

export type AdminUniversityRow = {
  id: string;
  name: string;
  slug: string;
  institutionalEmailDomains: string[];
  isActive: boolean;
  /** Cantidad de careers del catálogo asociadas (badge del listado admin). */
  careerCount: number;
};

/** Detalle completo de una universidad, para prefillear el form de edición. */
export type UniversityDetail = {
  id: string;
  name: string;
  slug: string;
  institutionalEmailDomains: string[];
  isActive: boolean;
};

/**
 * Estado de los server actions de alta/edición (US-060). Vive en types (actions.ts solo exporta
 * funciones async). En success el cliente redirige al listado; en error muestra el mensaje.
 */
export type ManageUniversityFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageUniversityState: ManageUniversityFormState = { status: 'idle' };

/** Resultado de los toggles de estado (desactivar / reactivar), invocados desde los botones de fila. */
export type ToggleResult = { ok: true } | { ok: false; message: string };
