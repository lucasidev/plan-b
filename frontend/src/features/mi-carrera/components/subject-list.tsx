'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import { reviewCountForSubject } from '@/features/mi-carrera/data/reviews';
import { teachersForSubject } from '@/features/mi-carrera/data/teachers';
import {
  distinctYears,
  emptyFilters,
  filterSubjects,
  type SubjectFilters,
} from '@/features/mi-carrera/lib/filters';
import { stateLabel } from '@/features/mi-carrera/lib/subject-status';
import { cn } from '@/lib/utils';
import { ModalityBadge } from './modality-badge';

type Props = {
  plan: PlanYear[];
};

type SubjectWithYear = PlannedSubject & { year: number };

/**
 * Tab "Catálogo" (Materias) de Mi carrera (US-045-d). Port literal del mock
 * `canvas-mocks/v2-screens.jsx::V2CarreraCatalogo`. Lista filtrable de las
 * materias del plan con CTA "Ver detalle" → drawer (US-045-d).
 *
 * Estado local con useState (MVP). Si hace falta sharable filters via URL
 * en el futuro, migrar a `nuqs` sin tocar `lib/filters.ts`.
 *
 * Performance: <50 items, filter local sin debounce. No hace falta useMemo
 * pesado pero envuelvo el filtrado igual para evitar recomputar en cada
 * render de eventos no-filter (ej. hover).
 */
export function SubjectList({ plan }: Props) {
  const allSubjects: SubjectWithYear[] = useMemo(
    () => plan.flatMap((y) => y.subjects.map((s) => ({ ...s, year: y.year }))),
    [plan],
  );
  const years = useMemo(() => distinctYears(allSubjects), [allSubjects]);
  const [filters, setFilters] = useState<SubjectFilters>(emptyFilters);

  const visible = useMemo(() => filterSubjects(allSubjects, filters), [allSubjects, filters]);

  const updateFilter = <K extends keyof SubjectFilters>(key: K, value: SubjectFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-col gap-3">
      <FilterBar filters={filters} years={years} onChange={updateFilter} />

      {visible.length === 0 ? (
        <div className="bg-bg-card border border-line rounded-lg p-10 text-center text-ink-3">
          No encontramos materias con esos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((s) => (
            <SubjectCard key={s.code} subject={s} />
          ))}
        </div>
      )}
    </div>
  );
}

type FilterBarProps = {
  filters: SubjectFilters;
  years: number[];
  onChange: <K extends keyof SubjectFilters>(key: K, value: SubjectFilters[K]) => void;
};

function FilterBar({ filters, years, onChange }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 items-center',
        'bg-bg-card border border-line rounded-lg px-4 py-2.5',
      )}
    >
      <input
        type="search"
        value={filters.query}
        onChange={(e) => onChange('query', e.target.value)}
        placeholder="Buscar por nombre o código..."
        aria-label="Buscar materia"
        className={cn(
          'flex-1 min-w-[200px] px-3 py-1.5 text-sm rounded-md',
          'bg-bg border border-line text-ink placeholder:text-ink-3',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
        )}
      />
      <Select
        ariaLabel="Filtrar por año"
        value={filters.year == null ? '' : String(filters.year)}
        onChange={(v) => onChange('year', v === '' ? null : Number(v))}
        options={[
          ['', 'Todos los años'],
          ...years.map<[string, string]>((y) => [String(y), `${y}° año`]),
        ]}
      />
      <Select
        ariaLabel="Filtrar por modalidad"
        value={filters.modality ?? ''}
        onChange={(v) => onChange('modality', v === '' ? null : (v as SubjectFilters['modality']))}
        options={[
          ['', 'Cualquier modalidad'],
          ['1c', '1er cuatri'],
          ['2c', '2do cuatri'],
          ['anual', 'Anual'],
        ]}
      />
      <Select
        ariaLabel="Filtrar por estado"
        value={filters.state ?? ''}
        onChange={(v) => onChange('state', v === '' ? null : (v as SubjectFilters['state']))}
        options={[
          ['', 'Cualquier estado'],
          ['AP', 'Aprobada'],
          ['CU', 'Cursando'],
          ['PD', 'Pendiente'],
        ]}
      />
    </div>
  );
}

type SelectProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
};

function Select({ ariaLabel, value, onChange, options }: SelectProps) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'px-2.5 py-1.5 text-sm rounded-md',
        'bg-bg-card border border-line text-ink-2 cursor-pointer',
        'focus:outline-none focus:border-accent',
      )}
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function SubjectCard({ subject }: { subject: SubjectWithYear }) {
  const teachers = teachersForSubject(subject.code);
  const teachersLabel =
    teachers.length === 0
      ? 'Sin docentes asignados'
      : teachers.map((t) => t.name.split(',')[0]).join(' · ');
  const reviewCount = reviewCountForSubject(subject.code);
  const rating =
    teachers.length > 0
      ? (teachers.reduce((acc, t) => acc + t.rating.overall, 0) / teachers.length).toFixed(1)
      : null;

  return (
    <Link
      href={`/mi-carrera/materia/${subject.code}`}
      className={cn(
        'flex flex-col gap-1 p-4 rounded-md border bg-bg-card transition-colors',
        'border-line hover:border-accent hover:bg-bg-elev',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
      data-state={subject.state}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10.5px] text-ink-3">{subject.code}</span>
        <ModalityBadge modality={subject.modality} />
        <span className="flex-1" />
        {rating != null && (
          <span className="font-mono text-sm font-semibold text-ink">{rating} ★</span>
        )}
      </div>
      <div className="text-sm font-medium text-ink leading-snug">{subject.name}</div>
      <div className="text-xs text-ink-3 flex flex-wrap gap-x-2">
        <span>{teachersLabel}</span>
        <span>·</span>
        <span>{reviewCount} reseñas</span>
        <span>·</span>
        <span>{subject.year}° año</span>
        <span>·</span>
        <span>{stateLabel[subject.state]}</span>
      </div>
    </Link>
  );
}
