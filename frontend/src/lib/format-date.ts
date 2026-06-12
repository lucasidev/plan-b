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
