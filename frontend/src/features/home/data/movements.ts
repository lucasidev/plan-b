/**
 * Feed de movimientos recientes del entorno del alumno (respuestas a
 * reseñas, nuevas reseñas en su plan, fechas de parciales que cambiaron,
 * etc.). Shape espejada del array inline en `v2-screens.jsx::V2Inicio`.
 *
 * `timestamp` ya viene como string relativo formateado en el mock (ej.
 * "hace 2h", "hace 1d"). Cuando aterrice el módulo de notificaciones
 * real, los timestamps llegan como ISO 8601 desde el backend y un helper
 * `formatRelativeTime(date, now)` los convierte a string en el componente
 * de display.
 */
export type Movement = {
  id: string;
  /** String relativo pre-formateado en MVP (ej. "hace 2h"). */
  timestamp: string;
  /** Body de la notificación, una línea. */
  body: string;
};

// TODO: cuando aterrice el backend de notificaciones (US-Notif), reemplazar
// por fetch a `GET /api/me/movements?limit=N`. El shape pasa a usar ISO
// timestamps; un helper en `lib/time.ts` los convierte a string relativo
// en el componente.
export const movements: Movement[] = [
  { id: '1', timestamp: 'hace 2h', body: 'Brandt respondió a tu reseña de ISW301' },
  { id: '2', timestamp: 'hace 1d', body: 'Nueva reseña en INT302 (4★)' },
  { id: '3', timestamp: 'hace 3d', body: 'Iturralde subió la fecha del parcial' },
];
