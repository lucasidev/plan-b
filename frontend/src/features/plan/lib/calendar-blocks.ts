import type { CalendarWeekBlock } from '../types';

/**
 * Derivación pura de bloques para `CalendarWeek` (US-096): a qué columna de día caen, en qué
 * minuto arrancan/duran, y qué "lane" (carril horizontal) les toca cuando se superponen con otro
 * bloque del mismo día (el caso central de esta feature: dos comisiones que chocan tienen que
 * verse una al lado de la otra, nunca una tapando a la otra).
 */

/** Lun-Vie, en ese orden: el calendario no muestra sábado ni domingo (mismo recorte visual que el
 * mock que reemplaza). Un bloque de sábado/domingo se descarta en `layoutWeekBlocks`. */
const DAY_INDEX: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
};

export type PositionedWeekBlock = CalendarWeekBlock & {
  dayIndex: number;
  startMinutes: number;
  durationMinutes: number;
  /** Carril horizontal (0-based) dentro de su cluster de solapamiento. */
  lane: number;
  /** Cuántos carriles tiene el cluster de solapamiento al que pertenece este bloque. */
  laneCount: number;
};

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Agrupa bloques de un mismo día en clusters de solapamiento transitivo (sweep por hora de inicio,
 * llevando el fin máximo visto): dos bloques que se tocan en el tiempo comparten cluster aunque no
 * se solapen directamente entre sí (A-B se solapan, B-C se solapan, entonces A/B/C comparten
 * cluster), porque los tres ocupan la misma franja visual y hay que separarlos para que no se
 * tapen. Dentro de un cluster, cada bloque recibe su propio carril (orden por inicio).
 */
function assignLanes(
  sameDayBlocks: (CalendarWeekBlock & { startMinutes: number; durationMinutes: number })[],
) {
  const sorted = [...sameDayBlocks].sort((a, b) => a.startMinutes - b.startMinutes);

  const result: (CalendarWeekBlock & {
    startMinutes: number;
    durationMinutes: number;
    lane: number;
    laneCount: number;
  })[] = [];

  let cluster: typeof sorted = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flushCluster = () => {
    cluster.forEach((block, lane) => {
      result.push({ ...block, lane, laneCount: cluster.length });
    });
    cluster = [];
  };

  for (const block of sorted) {
    if (cluster.length > 0 && block.startMinutes >= clusterEnd) {
      flushCluster();
    }
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.startMinutes + block.durationMinutes);
  }
  flushCluster();

  return result;
}

/**
 * Convierte bloques crudos (día como nombre de la semana, horas "HH:mm") en bloques posicionables:
 * agrega el índice de columna, los minutos y el carril. Bloques de sábado/domingo se descartan (el
 * calendario solo tiene columnas Lun-Vie).
 */
export function layoutWeekBlocks(blocks: readonly CalendarWeekBlock[]): PositionedWeekBlock[] {
  const withMinutes = blocks
    .filter((b) => b.day in DAY_INDEX)
    .map((b) => ({
      ...b,
      dayIndex: DAY_INDEX[b.day],
      startMinutes: toMinutes(b.start),
      durationMinutes: toMinutes(b.end) - toMinutes(b.start),
    }));

  const result: PositionedWeekBlock[] = [];
  for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
    const dayBlocks = withMinutes.filter((b) => b.dayIndex === dayIndex);
    for (const positioned of assignLanes(dayBlocks)) {
      result.push({ ...positioned, dayIndex });
    }
  }
  return result;
}

/** Rango de horas [inicio, cantidad) que cubre el conjunto de bloques, sin padding inventado: el
 * calendario se ajusta a los datos reales en vez de mostrar una franja horaria fija. */
export function computeHourRange(blocks: readonly PositionedWeekBlock[]): {
  startHour: number;
  hourCount: number;
} {
  if (blocks.length === 0) {
    return { startHour: 8, hourCount: 12 };
  }
  const startHours = blocks.map((b) => Math.floor(b.startMinutes / 60));
  const endHours = blocks.map((b) => Math.ceil((b.startMinutes + b.durationMinutes) / 60));
  const startHour = Math.min(...startHours);
  const endHour = Math.max(...endHours);
  return { startHour, hourCount: Math.max(endHour - startHour, 1) };
}
