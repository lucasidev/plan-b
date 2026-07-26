import { COMMISSION_DAY_ABBREVIATIONS, COMMISSION_DAYS, type CommissionDay } from '../schema';
import type { CommissionScheduleBlock, CommissionTeacherAssignment } from '../types';

/**
 * Formateo de la oferta de una comisión para las pantallas del backoffice (US-093). Vive acá y no en
 * el componente de la tabla porque un archivo que exporta componentes no puede exportar otra cosa
 * sin romper fast refresh (react-doctor lo bloquea en el push).
 */

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
