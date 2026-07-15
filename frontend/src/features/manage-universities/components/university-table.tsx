'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateUniversityAction, reactivateUniversityAction } from '../actions';
import type { AdminUniversityRow } from '../types';

const GRID = 'minmax(0,1.5fr) minmax(0,1.3fr) 90px 96px 168px';

/**
 * Tabla del backoffice de universidades (US-060 admin). Densa, mono para metadatos, tablas sobre
 * cards (registro admin del design system; mismo patrón que TeacherTable de US-063). Trae activas +
 * inactivas; cada fila ofrece Editar + Desactivar (activas) o Reactivar (inactivas). Mutación pura
 * (ADR-0046): los toggles refrescan la RSC.
 */
export function UniversityTable({ universities }: { universities: AdminUniversityRow[] }) {
  if (universities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Todavía no hay universidades cargadas. Afiliá la primera con "Afiliar universidad".
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
        <div>Universidad</div>
        <div>Dominios institucionales</div>
        <div className="text-right">Carreras</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {universities.map((u) => (
        <UniversityRow key={u.id} university={u} />
      ))}
    </div>
  );
}

function UniversityRow({ university }: { university: AdminUniversityRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runToggle() {
    if (university.isActive && !window.confirm(`¿Desactivar ${university.name}?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = university.isActive
        ? await deactivateUniversityAction(university.id)
        : await reactivateUniversityAction(university.id);
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
        className={cn(
          'grid items-center gap-3.5 px-3.5 py-2',
          !university.isActive && 'opacity-60',
        )}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{university.name}</div>
          <div className="truncate font-mono text-[10px] text-ink-4">{university.slug}</div>
        </div>
        <div className="truncate text-ink-2">
          {university.institutionalEmailDomains.length > 0 ? (
            university.institutionalEmailDomains.join(', ')
          ) : (
            <span className="text-ink-4">sin dominios</span>
          )}
        </div>
        <div className="text-right font-mono text-ink-2">{university.careerCount}</div>
        <div>
          <StatusBadge active={university.isActive} />
        </div>
        <div className="flex items-center justify-end gap-1">
          {university.isActive && (
            <Link
              href={`/admin/universities/${university.id}/edit`}
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
              university.isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : university.isActive ? 'Desactivar' : 'Reactivar'}
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
      {active ? 'ACTIVA' : 'INACTIVA'}
    </span>
  );
}
