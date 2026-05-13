'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type Teacher, teachers } from '@/features/mi-carrera/data/teachers';
import { cn } from '@/lib/utils';

type Props = {
  /** Lista a renderear. Por default usa el mock global de teachers.ts. */
  teachers?: Teacher[];
};

/**
 * Tab "Docentes" de Mi carrera (US-045-d). Port literal del mock
 * `canvas-mocks/v2-screens.jsx::V2CarreraDocentes`. Lista de docentes que
 * dictan materias del plan del alumno con buscador local y CTA "Ver
 * detalle" → drawer.
 *
 * Performance: pocos docentes (≤ 30 en plan típico), filter local
 * instantáneo sin debounce.
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
      href={`/mi-carrera/docente/${teacher.id}`}
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
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={5}
      className="h-1.5 rounded-full bg-bg-elev overflow-hidden"
    >
      <div
        className={cn('h-full rounded-full', tone === 'good' ? 'bg-st-approved-fg' : 'bg-ink-3')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
