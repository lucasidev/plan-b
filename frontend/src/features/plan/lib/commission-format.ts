import type { CommissionScheduleSlot } from '../types';

/**
 * Formateo de datos de comisión para el picker y el comparador (US-096). Duplica, a propósito y en
 * chico, el mismo criterio de `formatCommissionSchedule`/`COMMISSION_MODALITY_LABELS` de
 * `features/manage-commissions` (admin): no se comparte cross-feature (regla dura del repo) y el
 * abstraction just-in-time todavía no tiene un segundo consumidor que justifique moverlo a `lib/`.
 */

const MODALITY_LABELS: Record<string, string> = {
  Presencial: 'Presencial',
  Virtual: 'Virtual',
  Hibrida: 'Híbrida',
};

/** Label legible de la modalidad de una comisión. Degrada al valor crudo si no lo conocemos, en
 * vez de romper (mismo criterio que `formatTermKind` de `@/lib/academic-terms`). */
export function formatCommissionModality(modality: string): string {
  return MODALITY_LABELS[modality] ?? modality;
}

const DAY_ABBREVIATIONS: Record<string, string> = {
  Monday: 'Lu',
  Tuesday: 'Ma',
  Wednesday: 'Mi',
  Thursday: 'Ju',
  Friday: 'Vi',
  Saturday: 'Sa',
  Sunday: 'Do',
};

const DAY_ORDER: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

/** "14:00" -> "14"; "14:30" -> "14:30". El minuto solo se muestra cuando no es en punto. */
function formatHour(time: string): string {
  const [hour, minute] = time.split(':');
  const bareHour = String(Number(hour));
  return minute === '00' ? bareHour : `${bareHour}:${minute}`;
}

/**
 * "Lu/Mi 18-22" (horario resumido de una comisión): agrupa las franjas con el mismo horario y
 * junta los días abreviados de cada grupo. Varios grupos con horarios distintos se separan con
 * coma. Ordena por día y hora antes de agrupar, no asume que el caller ya lo mandó ordenado.
 */
export function formatScheduleSummary(schedule: readonly CommissionScheduleSlot[]): string {
  if (schedule.length === 0) return 'sin horario cargado';

  const sorted = [...schedule].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    return dayDiff !== 0 ? dayDiff : a.start.localeCompare(b.start);
  });

  const groups: { key: string; start: string; end: string; days: string[] }[] = [];
  for (const slot of sorted) {
    const key = `${slot.start}-${slot.end}`;
    const abbreviation = DAY_ABBREVIATIONS[slot.day] ?? slot.day;
    const group = groups.find((g) => g.key === key);
    if (group) {
      group.days.push(abbreviation);
    } else {
      groups.push({ key, start: slot.start, end: slot.end, days: [abbreviation] });
    }
  }

  return groups
    .map((g) => `${g.days.join('/')} ${formatHour(g.start)}-${formatHour(g.end)}`)
    .join(', ');
}
