import type {
  PlannedSubject,
  SubjectModality,
  SubjectState,
} from '@/features/mi-carrera/data/plan';

/**
 * Filtros aplicables al listado del tab "Catálogo" (US-045-d). MVP usa
 * `useState` local en el componente; si en el futuro se persisten en URL,
 * se migra a `nuqs` sin tocar esta lib (los helpers solo trabajan sobre la
 * shape de filtros, no sobre el storage).
 */
export type SubjectFilters = {
  /** Texto libre matcheado contra nombre + código (case-insensitive). */
  query: string;
  /** Año específico o null para "todos". */
  year: number | null;
  /** Modalidad específica o null para "todas". */
  modality: SubjectModality | null;
  /** Estado específico o null para "todos". */
  state: SubjectState | null;
};

export const emptyFilters: SubjectFilters = {
  query: '',
  year: null,
  modality: null,
  state: null,
};

type SubjectWithYear = PlannedSubject & { year: number };

/**
 * Aplica filtros y devuelve un nuevo array. No muta el input.
 * El año se inyecta por el caller porque vive en el container (PlanYear),
 * no en el subject.
 */
export function filterSubjects(
  subjects: SubjectWithYear[],
  filters: SubjectFilters,
): SubjectWithYear[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  return subjects.filter((s) => {
    if (normalizedQuery) {
      const haystack = `${s.name} ${s.code}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    if (filters.year != null && s.year !== filters.year) return false;
    if (filters.modality != null && s.modality !== filters.modality) return false;
    if (filters.state != null && s.state !== filters.state) return false;
    return true;
  });
}

/**
 * Devuelve los años únicos presentes en el array de subjects, ordenados
 * ascendentes. Útil para construir el selector del filtro de año.
 */
export function distinctYears(subjects: SubjectWithYear[]): number[] {
  return [...new Set(subjects.map((s) => s.year))].toSorted((a, b) => a - b);
}
