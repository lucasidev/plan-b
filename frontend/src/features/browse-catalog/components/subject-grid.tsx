import Link from 'next/link';
import { Pill } from '@/components/ui';
import type { Subject } from '../types';

type SubjectTermGroup = {
  /** Clave estable para el `key` de React: `${termInYear ?? 'anual'}-${termKind}`. */
  key: string;
  termInYear: number | null;
  termKind: string;
  subjects: Subject[];
};

export type SubjectYearGroup = {
  yearInPlan: number;
  terms: SubjectTermGroup[];
};

const ORDINALS: Record<number, string> = {
  1: '1er',
  2: '2do',
  3: '3er',
  4: '4to',
  5: '5to',
  6: '6to',
};

const TERM_NOUNS: Record<string, string> = {
  Cuatrimestral: 'cuatrimestre',
  Semestral: 'semestre',
  Bimestral: 'bimestre',
};

/** "1er cuatrimestre", "2do bimestre", "Anual" (termKind Anual no tiene número de término). */
export function formatTermLabel(termInYear: number | null, termKind: string): string {
  if (termKind === 'Anual' || termInYear === null) return 'Anual';
  const ordinal = ORDINALS[termInYear] ?? `${termInYear}°`;
  const noun = TERM_NOUNS[termKind] ?? termKind.toLowerCase();
  return `${ordinal} ${noun}`;
}

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

  const termOrder = (term: SubjectTermGroup) => term.termInYear ?? Number.MAX_SAFE_INTEGER;
  const byCode = (a: Subject, b: Subject) => a.code.localeCompare(b.code);

  return [...years.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([yearInPlan, termMap]) => ({
      yearInPlan,
      terms: [...termMap.values()]
        .sort((a, b) => termOrder(a) - termOrder(b))
        .map((term) => ({ ...term, subjects: [...term.subjects].sort(byCode) })),
    }));
}

/**
 * Grilla de materias de un plan (US-001, `/plans/[id]/subjects`), agrupada por año y término.
 * Sin estados de alumno (aprobada/regular/etc.): eso es Mi carrera (US-045), logueado. Acá solo
 * el listado público code + name + termKind, cada uno linkeando al detalle público (US-002).
 *
 * TODO(US-001): correlativas (para_cursar / para_rendir) cuando el catálogo público las exponga.
 * `SubjectListItem` (GET /api/academic/subjects) hoy no las trae; requiere extender el backend.
 */
export function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">Todavía no hay materias cargadas para este plan.</p>
    );
  }

  const groups = groupSubjectsByYear(subjects);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((yearGroup) => (
        <section key={yearGroup.yearInPlan} aria-label={`Año ${yearGroup.yearInPlan}`}>
          <h2 className="font-display text-[16px] font-semibold text-ink">
            Año {yearGroup.yearInPlan}
          </h2>
          <div className="mt-3 flex flex-col gap-5">
            {yearGroup.terms.map((term) => (
              <div key={term.key}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
                  {formatTermLabel(term.termInYear, term.termKind)}
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {term.subjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="flex flex-col gap-1.5 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
    >
      <span className="font-mono text-[10.5px] tracking-wide text-ink-3">{subject.code}</span>
      <span className="text-[13.5px] font-medium leading-snug text-ink">{subject.name}</span>
      <Pill className="self-start">{subject.termKind}</Pill>
    </Link>
  );
}
