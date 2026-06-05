'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type Teacher, teachers } from '@/features/my-career/data/teachers';
import { cn } from '@/lib/utils';

type Props = {
  /** List to render. Defaults to the global mock from teachers.ts. */
  teachers?: Teacher[];
};

/**
 * "Docentes" tab of Mi carrera (US-045-d). Literal port of the mock
 * `canvas-mocks/v2-screens.jsx::V2CarreraDocentes`. List of teachers who deliver
 * subjects of the student's plan with a local search and a "Ver detalle" CTA opening
 * the drawer.
 *
 * Performance: few teachers (<=30 in a typical plan), instant local filter without
 * debounce.
 */
export function TeacherList({ teachers: input = teachers }: Props) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return input;
    return input.filter((t) => t.name.toLowerCase().includes(q));
  }, [input, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-bg-card border border-line rounded-lg px-4 py-2.5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar docente por nombre..."
          aria-label="Buscar docente"
          className={cn(
            'w-full px-3 py-1.5 text-sm rounded-md',
            'bg-bg border border-line text-ink placeholder:text-ink-3',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
          )}
        />
      </div>

      {visible.length === 0 ? (
        <div className="bg-bg-card border border-line rounded-lg p-10 text-center text-ink-3">
          No encontramos docentes con ese nombre.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((t) => (
            <TeacherCard key={t.id} teacher={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const ratingTone = teacher.rating.overall >= 4 ? 'good' : 'neutral';
  return (
    <Link
      href={`/my-career/teacher/${teacher.id}`}
      className={cn(
        'flex flex-col gap-2 p-4 rounded-md border bg-bg-card transition-colors',
        'border-line hover:border-accent hover:bg-bg-elev',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink leading-tight">{teacher.name}</div>
          <div className="text-[11.5px] text-ink-3 mt-0.5 line-clamp-2">
            {teacher.subjects.join(' · ')}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg font-semibold text-ink leading-none">
            {teacher.rating.overall.toFixed(1)}
          </div>
          <div className="text-[10px] text-ink-3 mt-0.5">
            /5 · {teacher.rating.reviewCount} reseñas
          </div>
        </div>
      </div>
      <RatingBar value={teacher.rating.overall} tone={ratingTone} />
    </Link>
  );
}

type RatingBarProps = {
  value: number;
  tone: 'good' | 'neutral';
};

function RatingBar({ value, tone }: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  // Visual wrapper + hidden semantic meter. The native <meter> has per-browser styling
  // that is hard to override consistently, so we leave it invisible (sr-only) to keep
  // the accessible semantics while rendering the custom bar with divs. Resolves
  // react-doctor/prefer-tag-over-role without breaking the visual.
  return (
    <div className="h-1.5 rounded-full bg-bg-elev overflow-hidden">
      <meter
        className="sr-only"
        value={value}
        min={0}
        max={5}
        aria-label={`Rating ${value} de 5`}
      />
      <div
        aria-hidden
        className={cn('h-full rounded-full', tone === 'good' ? 'bg-st-approved-fg' : 'bg-ink-3')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
