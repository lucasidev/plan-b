import { compareSubjectsByCode, type Subject } from '@/features/browse-catalog';

export type SubjectsOfYear = {
  yearInPlan: number;
  subjects: Subject[];
};

/**
 * Las materias del plan agrupadas solo por año (US-134, SC-018, `V.career().main` de la maqueta
 * aprobada): a diferencia de `groupSubjectsByYear` (browse-catalog, que agrupa además por
 * cuatrimestre para `/plans/[id]/subjects`), acá el plan va compacto, una columna por año.
 */
export function groupSubjectsByYearOnly(subjects: readonly Subject[]): SubjectsOfYear[] {
  const byYear = new Map<number, Subject[]>();
  for (const subject of subjects) {
    const list = byYear.get(subject.yearInPlan) ?? [];
    list.push(subject);
    byYear.set(subject.yearInPlan, list);
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([yearInPlan, list]) => ({
      yearInPlan,
      subjects: [...list].sort(compareSubjectsByCode),
    }));
}
