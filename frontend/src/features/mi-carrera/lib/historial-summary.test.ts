import { describe, expect, it } from 'vitest';
import type { HistorialEntry, HistorialPeriod } from '@/features/mi-carrera/data/historial';
import {
  buildSummary,
  firstPeriodLabel,
  overallAverage,
  periodsCount,
  totalApproved,
} from './historial-summary';

const entry = (
  code: string,
  state: 'aprob' | 'recurso',
  grade: number | null = state === 'aprob' ? 8 : null,
): HistorialEntry => ({
  code,
  name: `${code} fixture`,
  state,
  grade,
  teacher: 'Test',
});

const fixturePeriods: HistorialPeriod[] = [
  {
    period: '2025·2c',
    avg: 8,
    items: [entry('A', 'aprob', 8), entry('B', 'aprob', 9)],
  },
  {
    period: '2025·1c',
    avg: 7,
    items: [entry('C', 'aprob', 7), entry('D', 'recurso', null)],
  },
  {
    period: '2024·1c',
    avg: 8,
    items: [entry('E', 'aprob', 8)],
  },
];

describe('totalApproved', () => {
  it('cuenta solo las entradas con state=aprob', () => {
    expect(totalApproved(fixturePeriods)).toBe(4);
  });

  it('devuelve 0 con periods vacío', () => {
    expect(totalApproved([])).toBe(0);
  });

  it('devuelve 0 si nada está aprobado', () => {
    expect(totalApproved([{ period: 'X', avg: 0, items: [entry('Z', 'recurso')] }])).toBe(0);
  });
});

describe('overallAverage', () => {
  it('promedia notas no-null con 1 decimal', () => {
    expect(overallAverage(fixturePeriods)).toBe('8.0');
  });

  it('devuelve "—" cuando no hay notas', () => {
    expect(overallAverage([])).toBe('—');
    expect(overallAverage([{ period: 'X', avg: 0, items: [entry('Z', 'recurso')] }])).toBe('—');
  });

  it('ignora grade null al computar el promedio', () => {
    const periods: HistorialPeriod[] = [
      { period: 'P', avg: 0, items: [entry('A', 'aprob', 10), entry('B', 'recurso', null)] },
    ];
    expect(overallAverage(periods)).toBe('10.0');
  });
});

describe('periodsCount', () => {
  it('cuenta cantidad de períodos del array', () => {
    expect(periodsCount(fixturePeriods)).toBe(3);
  });

  it('devuelve 0 sobre array vacío', () => {
    expect(periodsCount([])).toBe(0);
  });
});

describe('firstPeriodLabel', () => {
  it('mapea YYYY·1c a "Mar YYYY"', () => {
    expect(firstPeriodLabel(fixturePeriods)).toBe('Mar 2024');
  });

  it('mapea YYYY·2c a "Ago YYYY"', () => {
    const periods: HistorialPeriod[] = [
      { period: '2024·2c', avg: 0, items: [entry('A', 'aprob')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('Ago 2024');
  });

  it('mapea anual a "YYYY anual"', () => {
    const periods: HistorialPeriod[] = [
      { period: '2020·anual', avg: 0, items: [entry('A', 'aprob')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('2020 anual');
  });

  it('devuelve "—" sobre vacío', () => {
    expect(firstPeriodLabel([])).toBe('—');
  });

  it('usa el último elemento del array (el más antiguo asumiendo orden DESC)', () => {
    expect(firstPeriodLabel(fixturePeriods)).toBe('Mar 2024');
  });

  it('devuelve raw si el formato no matchea', () => {
    const periods: HistorialPeriod[] = [
      { period: 'mid-2023', avg: 0, items: [entry('A', 'aprob')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('mid-2023');
  });
});

describe('buildSummary', () => {
  it('arma el objeto completo con los 4 KPIs', () => {
    expect(buildSummary(fixturePeriods)).toEqual({
      totalApproved: 4,
      overallAverage: '8.0',
      periodsCount: 3,
      firstPeriodLabel: 'Mar 2024',
    });
  });

  it('sobre array vacío devuelve valores nulos legibles', () => {
    expect(buildSummary([])).toEqual({
      totalApproved: 0,
      overallAverage: '—',
      periodsCount: 0,
      firstPeriodLabel: '—',
    });
  });
});
