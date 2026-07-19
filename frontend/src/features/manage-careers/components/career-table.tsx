'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateCareerAction, reactivateCareerAction } from '../actions';
import type { AdminCareerRow } from '../types';

const GRID = 'minmax(0,1.6fr) minmax(0,1fr) 74px 96px 190px';

/**
 * Tabla del backoffice de carreras de una universidad (US-061 admin). Mismo registro visual que
 * UniversityTable (tabla densa, mono para metadatos). Trae activas + inactivas; el nombre linkea al
 * detalle (donde viven los planes). Cada fila ofrece Detalle + Editar (activas) o Reactivar
 * (inactivas). Mutación pura (ADR-0046): los toggles refrescan la RSC.
 */
export function CareerTable({
  universityId,
  careers,
}: {
  universityId: string;
  careers: AdminCareerRow[];
}) {
  if (careers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Todavía no hay carreras en esta universidad. Cargá la primera con "Nueva carrera".
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
        <div>Carrera</div>
        <div>Código</div>
        <div className="text-right">Planes</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {careers.map((c) => (
        <CareerRow key={c.id} universityId={universityId} career={c} />
      ))}
    </div>
  );
}

function CareerRow({ universityId, career }: { universityId: string; career: AdminCareerRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const detailHref = `/admin/universities/${universityId}/careers/${career.id}`;

  function runToggle() {
    if (career.isActive && !window.confirm(`¿Desactivar ${career.name}?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = career.isActive
        ? await deactivateCareerAction(career.id)
        : await reactivateCareerAction(career.id);
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
        className={cn('grid items-center gap-3.5 px-3.5 py-2', !career.isActive && 'opacity-60')}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="min-w-0">
          <Link href={detailHref} className="block truncate font-medium text-ink hover:underline">
            {career.name}
          </Link>
          <div className="truncate font-mono text-[10px] text-ink-4">{career.slug}</div>
        </div>
        <div className="truncate font-mono text-[11px] text-ink-2">
          {career.code ?? <span className="text-ink-4">sin código</span>}
        </div>
        <div className="text-right font-mono text-ink-2">{career.planCount}</div>
        <div>
          <StatusBadge active={career.isActive} />
        </div>
        <div className="flex items-center justify-end gap-1">
          <Link
            href={detailHref}
            className="rounded-md px-2 py-1 text-[11.5px] text-ink-2 hover:bg-bg-elev hover:text-ink"
          >
            Detalle
          </Link>
          {career.isActive && (
            <Link
              href={`${detailHref}/edit`}
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
              career.isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : career.isActive ? 'Desactivar' : 'Reactivar'}
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
