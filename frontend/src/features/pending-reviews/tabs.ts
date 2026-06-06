/**
 * IDs of the three tabs of the `/reviews` shell (US-048). Source of truth for the nav
 * and the page-level routing.
 *
 * `id` is the URL query-param value (code, English); `label` is the visible tab name
 * (UI string, Spanish). Only `pending` is functional in the US-048 PR-A slice; `explore`
 * and `mine` are stubbed until PR-B / PR-C.
 */
export const REVIEWS_TABS = [
  { id: 'explore', label: 'Explorar' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'mine', label: 'Mis reseñas' },
] as const;

export type ReviewsTabId = (typeof REVIEWS_TABS)[number]['id'];

const VALID_IDS = new Set<string>(REVIEWS_TABS.map((t) => t.id));

/**
 * Coerce an arbitrary `?tab=` query-param value into a valid `ReviewsTabId`. Invalid
 * values fall back to the default `explore`. The default matches the US-048 AC which
 * names Explorar as the entry tab; even though Explorar is not functional in PR-A, the
 * shell still uses it as the landing.
 */
export function parseReviewsTab(value: string | string[] | undefined): ReviewsTabId {
  if (typeof value !== 'string') return 'explore';
  if (!VALID_IDS.has(value)) return 'explore';
  return value as ReviewsTabId;
}
