'use client';

import { cn } from '@/lib/utils';
import type { CommissionTeacherOption } from '../types';

/**
 * "¿Quién te dio la cursada?" picker (US-065 docente real por reseña). The student reviews one real
 * teacher of the enrollment's commission, so this lists the commission's teachers and lets them pick
 * exactly one. The selected `teacherId` is what the publish action sends as `docenteResenadoId`
 * (replacing the old placeholder). Single-select, required.
 *
 * Role label maps the backend PascalCase enum to rioplatense display copy.
 */
const ROLE_LABELS: Record<string, string> = {
  Titular: 'Titular',
  Adjunto: 'Adjunto/a',
  Jtp: 'JTP',
  Ayudante: 'Ayudante',
  Invitado: 'Invitado/a',
};

export function TeacherPicker({
  teachers,
  selected,
  onSelect,
}: {
  teachers: CommissionTeacherOption[];
  selected: string | null;
  onSelect: (teacherId: string) => void;
}) {
  if (teachers.length === 0) {
    return (
      <p className="mt-3 text-[12.5px] text-ink-3">
        Esta comisión todavía no tiene docentes cargados en el catálogo.
      </p>
    );
  }

  return (
    <fieldset className="mt-3 flex flex-col gap-2">
      <legend className="sr-only">Elegí el docente que te dio la cursada</legend>
      {teachers.map((t) => {
        const name = `${t.firstName} ${t.lastName}`;
        const isSelected = selected === t.teacherId;
        return (
          <label
            key={t.teacherId}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded border px-3.5 py-2.5 transition-colors',
              isSelected
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-bg-card hover:border-ink-4',
            )}
          >
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name="docente-picker"
                value={t.teacherId}
                checked={isSelected}
                onChange={() => onSelect(t.teacherId)}
                className="accent-[var(--color-accent)]"
              />
              <span className="text-[13.5px] text-ink">{name}</span>
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
              {ROLE_LABELS[t.role] ?? t.role}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
