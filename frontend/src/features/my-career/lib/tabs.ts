/**
 * IDs for the five `/my-career` shell tabs. Source of truth for the nav, the stubs and
 * the real pages once the US-045-b/c/d/e slices land.
 *
 * `id` is the URL query-param value (code, English); `label` is the visible tab name
 * (UI string, Spanish).
 */
export const MY_CAREER_TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'prerequisites', label: 'Correlativas' },
  { id: 'catalog', label: 'Materias' },
  { id: 'teachers', label: 'Docentes' },
  { id: 'transcript', label: 'Historial' },
] as const;

export type MyCareerTabId = (typeof MY_CAREER_TABS)[number]['id'];

const VALID_IDS = new Set<string>(MY_CAREER_TABS.map((t) => t.id));

/**
 * Coerce an arbitrary `?tab=` query-param value into a valid `MyCareerTabId`. Any value
 * not in the list (empty, undefined, typo, a value from a removed future tab) falls back
 * to the default `plan`.
 *
 * Always returns a valid id so downstream components do not have to defend against bad
 * values. Doubles as a URL guard.
 */
export function parseTab(value: string | string[] | undefined): MyCareerTabId {
  if (typeof value !== 'string') return 'plan';
  if (!VALID_IDS.has(value)) return 'plan';
  return value as MyCareerTabId;
}
