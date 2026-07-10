/**
 * Relativo fino para la cola de moderación (US-050): "recién", "hace 12 min", "hace 3 h", "hace 2 d".
 * Distinto de `formatRelativeDate` de lib/, que es day-level ("hoy"/"ayer"/"hace N días") para el feed
 * de reseñas: acá el moderador necesita granularidad de minutos/horas para priorizar. El backend no
 * precomputa el `since`, así que se calcula en el momento del render contra el `createdAt` (UTC ISO).
 */
export function timeSince(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}
