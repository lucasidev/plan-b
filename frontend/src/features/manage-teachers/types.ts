/**
 * DTOs del backoffice de docentes (US-063 admin). Espejan los responses del backend:
 *  - Listado admin: GET /api/academic/teachers (activos + inactivos, gateado a rol admin)
 *  - Detalle para el form de edición: GET /api/academic/teachers/{id} (público, trae bio/photoUrl)
 *  - Universidades para el select del alta: GET /api/academic/universities (público)
 *
 * Los nombres vienen en title case listos para display (el storage es lowercase normalizado).
 */

export type AdminTeacherRow = {
  id: string;
  universityId: string;
  universityName: string;
  firstName: string;
  lastName: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
};

/** Detalle completo de un docente, para prefillear el form de edición. */
export type TeacherDetail = {
  id: string;
  universityId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

export type University = {
  id: string;
  name: string;
};

/**
 * Estado de los server actions de alta/edición (US-063). Vive en types (actions.ts solo exporta
 * funciones async). En success el cliente redirige al listado; en error muestra el mensaje.
 */
export type ManageTeacherFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialManageTeacherState: ManageTeacherFormState = { status: 'idle' };

/** Resultado de los toggles de estado (desactivar / reactivar), invocados desde los botones de fila. */
export type ToggleResult = { ok: true } | { ok: false; message: string };
