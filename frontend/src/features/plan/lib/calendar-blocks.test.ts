import { describe, expect, it } from 'vitest';
import type { CalendarWeekBlock } from '../types';
import { computeHourRange, layoutWeekBlocks } from './calendar-blocks';

function block(overrides: Partial<CalendarWeekBlock> = {}): CalendarWeekBlock {
  return {
    subjectCode: '111',
    day: 'Monday',
    start: '18:00',
    end: '20:00',
    clashing: false,
    ...overrides,
  };
}

describe('layoutWeekBlocks', () => {
  it('un bloque solo: dayIndex correcto, un único carril', () => {
    const [result] = layoutWeekBlocks([block({ day: 'Wednesday' })]);
    expect(result.dayIndex).toBe(2);
    expect(result.startMinutes).toBe(18 * 60);
    expect(result.durationMinutes).toBe(120);
    expect(result.lane).toBe(0);
    expect(result.laneCount).toBe(1);
  });

  it('calcula minutos con precisión de "HH:mm", no solo horas enteras', () => {
    const [result] = layoutWeekBlocks([block({ start: '18:30', end: '20:15' })]);
    expect(result.startMinutes).toBe(18 * 60 + 30);
    expect(result.durationMinutes).toBe(105);
  });

  it('dos bloques el mismo día sin superposición horaria: cada uno ocupa todo el ancho', () => {
    const result = layoutWeekBlocks([
      block({ subjectCode: 'A', start: '14:00', end: '16:00' }),
      block({ subjectCode: 'B', start: '18:00', end: '20:00' }),
    ]);
    expect(result.every((b) => b.laneCount === 1 && b.lane === 0)).toBe(true);
  });

  it('dos bloques que se superponen: cada uno recibe su propio carril', () => {
    const result = layoutWeekBlocks([
      block({ subjectCode: 'A', start: '18:00', end: '22:00' }),
      block({ subjectCode: 'B', start: '18:00', end: '21:00' }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.every((b) => b.laneCount === 2)).toBe(true);
    const lanes = result.map((b) => b.lane).sort();
    expect(lanes).toEqual([0, 1]);
  });

  it('tres bloques encadenados (A-B se solapan, B-C se solapan, A-C no): comparten cluster igual', () => {
    const result = layoutWeekBlocks([
      block({ subjectCode: 'A', start: '18:00', end: '19:00' }),
      block({ subjectCode: 'B', start: '18:30', end: '19:30' }),
      block({ subjectCode: 'C', start: '19:15', end: '20:00' }),
    ]);
    expect(result.every((b) => b.laneCount === 3)).toBe(true);
    expect(new Set(result.map((b) => b.lane)).size).toBe(3);
  });

  it('descarta bloques de sábado y domingo (la grilla solo tiene columnas Lun-Vie)', () => {
    const result = layoutWeekBlocks([block({ day: 'Saturday' }), block({ day: 'Sunday' })]);
    expect(result).toHaveLength(0);
  });
});

describe('computeHourRange', () => {
  it('se ajusta al rango real de los bloques, sin agregar padding', () => {
    const positioned = layoutWeekBlocks([block({ start: '18:00', end: '22:00' })]);
    expect(computeHourRange(positioned)).toEqual({ startHour: 18, hourCount: 4 });
  });

  it('lista vacía: devuelve un rango por default en vez de romper', () => {
    expect(computeHourRange([])).toEqual({ startHour: 8, hourCount: 12 });
  });
});
