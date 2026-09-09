/**
 * Returns a short relative copy for a past ISO 8601 timestamp compared to the
 * user's current local time: "hoy", "ayer", "hace 3 días", "hace 2 meses", etc.
 * Intended for display in review feeds and similar lists.
 */
export function formatRelativeDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(days / 365);
  if (years === 1) return 'hace 1 año';
  return `hace ${years} años`;
}

/**
 * Fecha corta en formato es-AR (dd/mm/aaaa), para una cita fechada donde el día exacto importa:
 * una nota editorial, un dato oficial relevado o pedido. A diferencia de `formatRelativeDate`, no
 * envejece con la lectura ("hace 3 días" cambia de significado con el tiempo; "07/09/2026" no).
 */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
