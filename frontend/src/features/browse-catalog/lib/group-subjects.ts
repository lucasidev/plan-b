import type { Subject } from '../types';

/**
 * Helpers puros de agrupamiento del catálogo de materias (US-001, `/plans/[id]/subjects`). Viven
 * acá y no en `subject-grid.tsx` porque un archivo que mezcla componentes con funciones sueltas
 * rompe el fast-refresh de React (regla `only-export-components`): al editar el componente, React
 * no puede recargar en caliente y recarga la página entera. Además son puros y testeables sin
 * montar el componente.
 */

type SubjectTermGroup = {
  /** Clave estable para el `key` de React: `${termInYear ?? 'anual'}-${termKind}`. */
  key: string;
  termInYear: number | null;
  /** Null agrupa las materias sin tipo de cursada, aparte de las anuales (`termKind: 'FullYear'`). */
  termKind: string | null;
  subjects: Subject[];
};

export type SubjectYearGroup = {
  yearInPlan: number;
  terms: SubjectTermGroup[];
};

/**
 * Agrupa las materias de un plan por `yearInPlan` y, dentro de cada año, por término
 * (`termInYear` + `termKind`: dos materias con el mismo número de término pero cadencia
 * distinta no deberían compartir grupo). Orden: año ascendente, término ascendente con
 * "Anual" al final de cada año (corre todo el año, no compite por posición con los
 * cuatrimestres/bimestres numerados), y dentro de cada término por `code`.
 */
export function groupSubjectsByYear(subjects: readonly Subject[]): SubjectYearGroup[] {
  const years = new Map<number, Map<string, SubjectTermGroup>>();

  for (const subject of subjects) {
    let termMap = years.get(subject.yearInPlan);
    if (!termMap) {
      termMap = new Map();
      years.set(subject.yearInPlan, termMap);
    }

    const termKey = `${subject.termInYear ?? 'anual'}-${subject.termKind}`;
    let group = termMap.get(termKey);
    if (!group) {
      group = {
        key: termKey,
        termInYear: subject.termInYear,
        termKind: subject.termKind,
        subjects: [],
      };
      termMap.set(termKey, group);
    }
    group.subjects.push(subject);
  }

  // Anual (termKind 'FullYear') y sin cadencia (termKind null) comparten termInYear null, así que
  // no alcanza con ese campo para ordenarlos: sin cadencia va último, después de todo lo numerado
  // y de Anual, porque no hay dato que lo ubique en el año.
  const termOrder = (term: SubjectTermGroup) => {
    if (term.termInYear !== null) return term.termInYear;
    return term.termKind === null ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - 1;
  };

  return [...years.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([yearInPlan, termMap]) => ({
      yearInPlan,
      terms: [...termMap.values()]
        .sort((a, b) => termOrder(a) - termOrder(b))
        .map((term) => ({ ...term, subjects: [...term.subjects].sort(compareSubjectsByCode) })),
    }));
}

/** Ordena por código; las materias sin código cargado van al final. */
export function compareSubjectsByCode(a: Subject, b: Subject): number {
  if (a.code === null) return b.code === null ? 0 : 1;
  if (b.code === null) return -1;
  return a.code.localeCompare(b.code);
}
