/**
 * IDs de los 5 tabs del shell `/mi-carrera`. Source of truth para la nav,
 * los stubs y las páginas reales cuando aterricen los slices US-045-b/c/d/e.
 */
export const MI_CARRERA_TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'correlativas', label: 'Correlativas' },
  { id: 'catalogo', label: 'Materias' },
  { id: 'docentes', label: 'Docentes' },
  { id: 'historial', label: 'Historial' },
] as const;

export type MiCarreraTabId = (typeof MI_CARRERA_TABS)[number]['id'];

const VALID_IDS = new Set<string>(MI_CARRERA_TABS.map((t) => t.id));

/**
 * Convierte un valor arbitrario del query param `?tab=` en un `MiCarreraTabId`
 * válido. Cualquier valor no listado (vacío, undefined, typo, valor de un
 * tab futuro removido) cae al default `plan`.
 *
 * Devuelve siempre un id válido para que el componente downstream no tenga
 * que defenderse contra valores invalidos. Vale como guard de URL.
 */
export function parseTab(value: string | string[] | undefined): MiCarreraTabId {
  if (typeof value !== 'string') return 'plan';
  if (!VALID_IDS.has(value)) return 'plan';
  return value as MiCarreraTabId;
}
