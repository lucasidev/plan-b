'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateSubjectAction, reactivateSubjectAction } from '../actions';
import type { AdminSubjectRow, SubjectDependent } from '../types';

const GRID = 'minmax(0,90px) minmax(0,1fr) 64px minmax(0,120px) 96px 168px';

/**
 * Tabla del backoffice de materias de un plan (US-062 admin), agrupada por año en el plan. Mismo
 * registro visual que CareerTable/TermTable (tabla densa, mono para metadatos). Trae activas +
 * archivadas (el listado admin las incluye); cada fila ofrece Editar + Archivar (activas) o
 * Reactivar (archivadas). El 409 has_dependents del archivado muestra el listado de materias
 * dependientes que devuelve el backend, no un error genérico. Mutación pura (ADR-0046): los toggles
 * refrescan la RSC.
 */
export function SubjectTable({
  basePath,
  subjects,
}: {
  basePath: string;
  subjects: AdminSubjectRow[];
}) {
  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Todavía no hay materias en este plan. Cargá la primera con "+ Materia".
        </p>
      </div>
    );
  }

  const groups = groupByYear(subjects);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      <div
        className="grid items-center gap-3.5 border-b border-line bg-bg-elev px-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
        style={{ gridTemplateColumns: GRID, height: 32 }}
      >
        <div>Código</div>
        <div>Materia</div>
        <div>Cuatr.</div>
        <div className="text-right">Horas</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {groups.map(([year, items]) => (
        <div key={year}>
          <div className="border-b border-line-2 bg-bg-elev/60 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
            Año {year} · {items.length}
          </div>
          {items.map((s) => (
            <SubjectRow key={s.id} basePath={basePath} subject={s} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SubjectRow({ basePath, subject }: { basePath: string; subject: AdminSubjectRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dependents, setDependents] = useState<SubjectDependent[] | null>(null);

  function runToggle() {
    if (subject.isActive && !window.confirm(`¿Archivar ${subject.name}?`)) {
      return;
    }
    setError(null);
    setDependents(null);
    startTransition(async () => {
      // Ramas separadas (no un ternario compartido): deactivate/reactivate devuelven tipos de
      // resultado distintos (solo deactivate trae `dependents`), y mantenerlas separadas evita la
      // ambigüedad de narrowing de TS sobre una unión de dos "ok: false" con distinta forma.
      if (subject.isActive) {
        const result = await deactivateSubjectAction(subject.id);
        if (result.ok) {
          router.refresh();
          return;
        }
        setError(result.message);
        if (result.dependents?.length) {
          setDependents(result.dependents);
        }
        return;
      }

      const result = await reactivateSubjectAction(subject.id);
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(result.message);
    });
  }

  return (
    <div className="border-b border-line-2 last:border-b-0">
      <div
        className={cn('grid items-center gap-3.5 px-3.5 py-2', !subject.isActive && 'opacity-60')}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="truncate font-mono text-ink">{subject.code}</div>
        <div className="truncate text-ink-2">{subject.name}</div>
        <div className="truncate font-mono text-[11px] text-ink-2">
          {formatTermLabel(subject.termKind, subject.termInYear)}
        </div>
        <div className="text-right font-mono text-[11px] text-ink-2">
          {subject.totalHours}
          <span className="text-ink-4"> ({subject.weeklyHours}/sem)</span>
        </div>
        <div>
          <StatusBadge active={subject.isActive} />
        </div>
        <div className="flex items-center justify-end gap-1">
          {subject.isActive && (
            <Link
              href={`${basePath}/${subject.id}/edit`}
              className="rounded-md px-2 py-1 text-[11.5px] text-ink-2 hover:bg-bg-elev hover:text-ink"
            >
              Editar
            </Link>
          )}
          <button
            type="button"
            onClick={runToggle}
            disabled={isPending}
            className={cn(
              'rounded-md px-2 py-1 text-[11.5px] disabled:opacity-50',
              subject.isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : subject.isActive ? 'Archivar' : 'Reactivar'}
          </button>
        </div>
      </div>
      {error && (
        <div className="px-3.5 pb-2">
          <p className="m-0 text-[11.5px] text-st-failed-fg" role="alert">
            {error}
          </p>
          {dependents && dependents.length > 0 && (
            <ul className="m-0 mt-1 flex flex-wrap gap-1 p-0">
              {dependents.map((d) => (
                <li
                  key={d.id}
                  className="rounded-sm bg-st-failed-bg px-1.5 py-0.5 font-mono text-[10.5px] text-st-failed-fg"
                >
                  {d.code} · {d.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em]',
        active ? 'bg-st-approved-bg text-st-approved-fg' : 'bg-st-pending-bg text-st-pending-fg',
      )}
    >
      {active ? 'ACTIVA' : 'ARCHIVADA'}
    </span>
  );
}

const TERM_KIND_ABBR: Record<string, string> = {
  Bimestral: 'b',
  Cuatrimestral: 'c',
  Semestral: 's',
};

/** "1c" (1er cuatrimestre), "2b" (2do bimestre); "anual" para materias anuales. */
function formatTermLabel(termKind: string, termInYear: number | null): string {
  if (termKind === 'Anual' || termInYear === null) {
    return 'anual';
  }
  return `${termInYear}${TERM_KIND_ABBR[termKind] ?? ''}`;
}

function groupByYear(subjects: AdminSubjectRow[]): [number, AdminSubjectRow[]][] {
  const map = new Map<number, AdminSubjectRow[]>();
  for (const s of [...subjects].sort(byYearThenTermThenCode)) {
    const bucket = map.get(s.yearInPlan);
    if (bucket) {
      bucket.push(s);
    } else {
      map.set(s.yearInPlan, [s]);
    }
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
}

function byYearThenTermThenCode(a: AdminSubjectRow, b: AdminSubjectRow): number {
  if (a.yearInPlan !== b.yearInPlan) return a.yearInPlan - b.yearInPlan;
  const termA = a.termInYear ?? 0;
  const termB = b.termInYear ?? 0;
  if (termA !== termB) return termA - termB;
  return a.code.localeCompare(b.code);
}
