'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { deactivateCommissionAction, reactivateCommissionAction } from '../actions';
import { COMMISSION_DAY_ABBREVIATIONS, COMMISSION_DAYS, type CommissionDay } from '../schema';
import type {
  CommissionScheduleBlock,
  CommissionTeacherAssignment,
  TermCommissionRow,
} from '../types';

const GRID = 'minmax(0,1.7fr) 56px minmax(0,1.3fr) minmax(0,1.2fr) 64px 168px 132px';

const DAY_ORDER: Record<string, number> = Object.fromEntries(
  COMMISSION_DAYS.map((day, i) => [day, i]),
);

/**
 * Separador del rango horario ("18-21"). El mockup usa un guión tipográfico, pero la regla de
 * puntuación del proyecto solo admite ASCII, así que va guión común.
 */
const HOUR_RANGE_SEPARATOR = '-';

/** "14:00" -> "14"; "14:30" -> "14:30". El minuto solo se muestra cuando no es en punto. */
function formatHour(time: string): string {
  const [hour, minute] = time.split(':');
  const bareHour = String(Number(hour));
  return minute === '00' ? bareHour : `${bareHour}:${minute}`;
}

/**
 * Agrupa los bloques horarios por rango (mismo start+end) y junta los días abreviados de cada grupo
 * (ej. lunes y miércoles con el mismo horario, se combinan en un solo grupo). Varios grupos con
 * horarios distintos se separan con coma. Ordena por día y hora antes de agrupar: no asume que el
 * caller ya lo mandó ordenado (el backend sí lo hace, pero la función formatea, no confía en el
 * input).
 */
export function formatCommissionSchedule(blocks: CommissionScheduleBlock[]): string {
  if (blocks.length === 0) return '-';

  const sorted = [...blocks].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    return dayDiff !== 0 ? dayDiff : a.start.localeCompare(b.start);
  });

  const groups: { key: string; start: string; end: string; days: string[] }[] = [];
  for (const block of sorted) {
    const key = `${block.start}-${block.end}`;
    const abbreviation = COMMISSION_DAY_ABBREVIATIONS[block.day as CommissionDay] ?? block.day;
    const group = groups.find((g) => g.key === key);
    if (group) {
      group.days.push(abbreviation);
    } else {
      groups.push({ key, start: block.start, end: block.end, days: [abbreviation] });
    }
  }

  return groups
    .map(
      (g) =>
        `${g.days.join('/')} ${formatHour(g.start)}${HOUR_RANGE_SEPARATOR}${formatHour(g.end)}`,
    )
    .join(', ');
}

/** Junta apellido y nombre de cada docente con punto medio; null cuando no hay docentes asignados. */
export function formatTeacherNames(teachers: CommissionTeacherAssignment[]): string | null {
  if (teachers.length === 0) return null;
  return teachers.map((t) => `${t.lastName}, ${t.firstName}`).join(' · ');
}

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
