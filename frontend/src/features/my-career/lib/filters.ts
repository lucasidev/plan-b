import type { PlannedSubject, SubjectModality, SubjectState } from '@/features/my-career/data/plan';

/**
 * Filters applicable to the "Catálogo" tab listing (US-045-d). MVP uses local `useState`
 * in the component; if filters get persisted in the URL in the future, migrate to
 * `nuqs` without touching this lib (helpers only work on the filter shape, not the
 * storage).
 */
export type SubjectFilters = {
  /** Free text matched against name + code (case-insensitive). */
  query: string;
  /** Specific year or null for "all". */
  year: number | null;
  /** Specific modality or null for "all". */
  modality: SubjectModality | null;
  /** Specific state or null for "all". */
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
 * Applies filters and returns a new array. Does not mutate the input. The year is
 * injected by the caller because it lives on the container (PlanYear), not the subject.
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
 * Returns the unique years present in the subjects array, sorted ascending. Useful for
 * building the year-filter selector.
 */
export function distinctYears(subjects: SubjectWithYear[]): number[] {
  return [...new Set(subjects.map((s) => s.year))].toSorted((a, b) => a - b);
}
