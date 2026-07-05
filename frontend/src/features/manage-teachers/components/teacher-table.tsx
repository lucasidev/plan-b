'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateTeacherAction, reactivateTeacherAction } from '../actions';
import type { AdminTeacherRow } from '../types';

const GRID = 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,0.9fr) 96px 168px';

/**
 * Tabla del backoffice de docentes (US-063 admin). Densa, mono para metadatos, tablas sobre cards
 * (registro admin del design system). Trae activos + inactivos; cada fila ofrece Editar + Desactivar
 * (activos) o Reactivar (inactivos). Mutación pura (ADR-0046): los toggles refrescan la RSC.
 */
export function TeacherTable({ teachers }: { teachers: AdminTeacherRow[] }) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Todavía no hay docentes cargados. Creá el primero con "Nuevo docente".
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
      <div
        className="grid items-center gap-3.5 border-b border-line bg-bg-elev px-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
        style={{ gridTemplateColumns: GRID, height: 32 }}
      >
        <div>Docente</div>
        <div>Universidad</div>
        <div>Cargo</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {teachers.map((t) => (
        <TeacherRow key={t.id} teacher={t} />
      ))}
    </div>
  );
}

function TeacherRow({ teacher }: { teacher: AdminTeacherRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runToggle() {
    if (
      teacher.isActive &&
      !window.confirm(`¿Desactivar a ${teacher.firstName} ${teacher.lastName}?`)
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = teacher.isActive
        ? await deactivateTeacherAction(teacher.id)
        : await reactivateTeacherAction(teacher.id);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="border-b border-line-2 last:border-b-0">
      <div
        className={cn('grid items-center gap-3.5 px-3.5 py-2', !teacher.isActive && 'opacity-60')}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">
            {teacher.firstName} {teacher.lastName}
          </div>
          <div className="truncate font-mono text-[10px] text-ink-4">{teacher.id}</div>
        </div>
        <div className="truncate text-ink-2">{teacher.universityName}</div>
        <div className="truncate text-ink-2">
          {teacher.title || <span className="text-ink-4">sin cargo</span>}
        </div>
        <div>
          <StatusBadge active={teacher.isActive} />
        </div>
        <div className="flex items-center justify-end gap-1">
          {teacher.isActive && (
            <Link
              href={`/admin/teachers/${teacher.id}/edit`}
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
              teacher.isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : teacher.isActive ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </div>
      {error && (
        <p className="m-0 px-3.5 pb-2 text-[11.5px] text-st-failed-fg" role="alert">
          {error}
        </p>
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
      {active ? 'ACTIVO' : 'INACTIVO'}
    </span>
  );
}
