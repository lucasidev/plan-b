import Link from 'next/link';
import { Pill } from '@/components/ui';
import { formatTermKind } from '@/lib/academic-terms';
import { formatTermLabel, groupSubjectsByYear } from '../lib/group-subjects';
import type { Subject } from '../types';

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
      <Pill className="self-start">{formatTermKind(subject.termKind)}</Pill>
    </Link>
  );
}
