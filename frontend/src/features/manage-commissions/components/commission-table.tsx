'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateCommissionAction, reactivateCommissionAction } from '../actions';
import { formatCommissionSchedule, formatTeacherNames } from '../lib/commission-format';
import type { TermCommissionRow } from '../types';

const GRID = 'minmax(0,1.7fr) 56px minmax(0,1.3fr) minmax(0,1.2fr) 64px 168px 132px';

/**
 * Tabla del backoffice de comisiones de un término, cross-materia (US-093 admin). Tabla densa, mono
 * para metadatos (mismo registro visual que TeacherTable/TermTable). Trae activas + inactivas: cada
 * fila ofrece Editar (activas) o Reactivar (inactivas), y chips de advertencia cuando faltan docentes
 * u horario. Mutación pura (ADR-0046): los toggles refrescan la RSC.
 */
export function CommissionTable({
  universityId,
  termId,
  commissions,
}: {
  universityId: string;
  termId: string;
  commissions: TermCommissionRow[];
}) {
  if (commissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
        <p className="m-0 text-[13px] text-ink-3">
          Todavía no hay comisiones cargadas para este período. Cargá la primera con "+ Nueva
          comisión".
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
        <div>Materia</div>
        <div className="text-center">Com.</div>
        <div>Docente</div>
        <div>Horario</div>
        <div className="text-right">Cupo</div>
        <div />
        <div className="text-right">Acciones</div>
      </div>
      {commissions.map((c) => (
        <CommissionRow
          key={c.commissionId}
          universityId={universityId}
          termId={termId}
          commission={c}
        />
      ))}
    </div>
  );
}

function CommissionRow({
  universityId,
  termId,
  commission,
}: {
  universityId: string;
  termId: string;
  commission: TermCommissionRow;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editHref =
    `/admin/commissions/${commission.commissionId}/edit` +
    `?subjectId=${commission.subjectId}&termId=${termId}&universityId=${universityId}`;

  function runToggle() {
    if (commission.isActive && !window.confirm(`¿Desactivar la comisión ${commission.name}?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = commission.isActive
        ? await deactivateCommissionAction(commission.commissionId)
        : await reactivateCommissionAction(commission.commissionId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const teacherNames = formatTeacherNames(commission.teachers);

  return (
    <div className="border-b border-line-2 last:border-b-0">
      <div
        className={cn(
          'grid items-center gap-3.5 px-3.5 py-2',
          !commission.isActive && 'opacity-60',
        )}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="min-w-0">
          <div className="truncate text-ink">{commission.subjectName}</div>
          <div className="truncate font-mono text-[10px] text-ink-4">{commission.subjectCode}</div>
        </div>
        <div className="text-center font-mono text-ink">{commission.name}</div>
        <div className="truncate text-ink-2">
          {teacherNames ?? <span className="text-ink-4">sin asignar</span>}
        </div>
        <div className="truncate font-mono text-[11px] text-ink-2">
          {formatCommissionSchedule(commission.schedule)}
        </div>
        <div className="text-right font-mono text-[11px] text-ink-2">
          {commission.capacity ?? <span className="text-ink-4">sin cupo</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {!commission.isActive && <Chip>INACTIVA</Chip>}
          {commission.teachers.length === 0 && <Chip>sin docente</Chip>}
          {commission.schedule.length === 0 && <Chip>sin horario</Chip>}
        </div>
        <div className="flex items-center justify-end gap-1">
          {commission.isActive && (
            <Link
              href={editHref}
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
              commission.isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : commission.isActive ? 'Desactivar' : 'Reactivar'}
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-st-pending-bg px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-st-pending-fg">
      {children}
    </span>
  );
}
