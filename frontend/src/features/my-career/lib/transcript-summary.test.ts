import { describe, expect, it } from 'vitest';
import type { TranscriptEntry, TranscriptPeriod } from '@/features/my-career/types';
import {
  buildSummary,
  firstPeriodLabel,
  overallAverage,
  periodsCount,
  totalApproved,
} from './transcript-summary';

// Mismo placeholder de "sin dato" que devuelve el módulo bajo test, armado sin repetir
// el carácter directamente en el archivo.
const NO_DATA = String.fromCharCode(8212);

const entry = (
  subjectCode: string,
  status: TranscriptEntry['status'],
  grade: number | null = status === 'Passed' ? 8 : null,
): TranscriptEntry => ({
  subjectCode,
  subjectName: `${subjectCode} fixture`,
  status,
  approvalMethod: null,
  grade,
  teacherLastName: 'Test',
});

const fixturePeriods: TranscriptPeriod[] = [
  {
    label: '2025-C2',
    year: 2025,
    number: 2,
    average: 8.5,
    items: [entry('A', 'Passed', 8), entry('B', 'Passed', 9)],
  },
  {
    label: '2025-C1',
    year: 2025,
    number: 1,
    average: 7,
    items: [entry('C', 'Passed', 7), entry('D', 'Failed', null)],
  },
  {
    label: '2024-C1',
    year: 2024,
    number: 1,
    average: 8,
    items: [entry('E', 'Passed', 8)],
  },
  {
    label: null,
    year: null,
    number: null,
    average: 10,
    items: [entry('F', 'Passed', 10)],
  },
];

describe('totalApproved', () => {
  it('cuenta solo las entradas con status Passed', () => {
    expect(totalApproved(fixturePeriods)).toBe(5);
  });

  it('devuelve 0 con periods vacío', () => {
    expect(totalApproved([])).toBe(0);
  });

  it('no cuenta Regularized, InProgress, Failed ni Dropped', () => {
    const periods: TranscriptPeriod[] = [
      {
        label: 'X',
        year: 2024,
        number: 1,
        average: null,
        items: [
          entry('A', 'Regularized', 7),
          entry('B', 'InProgress', null),
          entry('C', 'Failed', null),
          entry('D', 'Dropped', null),
        ],
      },
    ];
    expect(totalApproved(periods)).toBe(0);
  });
});

describe('overallAverage', () => {
  it('promedia notas no-null con 1 decimal', () => {
    expect(overallAverage(fixturePeriods)).toBe('8.4');
  });

  it('devuelve el placeholder cuando no hay notas', () => {
    expect(overallAverage([])).toBe(NO_DATA);
    expect(
      overallAverage([
        {
          label: 'X',
          year: 2020,
          number: 1,
          average: null,
          items: [entry('Z', 'InProgress', null)],
        },
      ]),
    ).toBe(NO_DATA);
  });

  it('ignora grade null al computar el promedio', () => {
    const periods: TranscriptPeriod[] = [
      {
        label: 'P',
        year: 2020,
        number: 1,
        average: null,
        items: [entry('A', 'Passed', 10), entry('B', 'Failed', null)],
      },
    ];
    expect(overallAverage(periods)).toBe('10.0');
  });

  it('incluye las notas del grupo sin período: no lo excluye como periodsCount', () => {
    const periods: TranscriptPeriod[] = [
      { label: '2024-C1', year: 2024, number: 1, average: 8, items: [entry('A', 'Passed', 8)] },
      { label: null, year: null, number: null, average: 10, items: [entry('B', 'Passed', 10)] },
    ];
    expect(overallAverage(periods)).toBe('9.0');
  });
});

describe('periodsCount', () => {
  it('cuenta cantidad de períodos del array', () => {
    expect(periodsCount(fixturePeriods)).toBe(3);
  });

  it('no cuenta el grupo sin período (label null)', () => {
    const periods: TranscriptPeriod[] = [
      { label: '2024-C1', year: 2024, number: 1, average: 8, items: [entry('A', 'Passed', 8)] },
      { label: null, year: null, number: null, average: 10, items: [entry('B', 'Passed', 10)] },
    ];
    expect(periodsCount(periods)).toBe(1);
  });

  it('devuelve 0 sobre array vacío', () => {
    expect(periodsCount([])).toBe(0);
  });
});

describe('firstPeriodLabel', () => {
  it('mapea YYYY-C1 a "Mar YYYY"', () => {
    expect(firstPeriodLabel(fixturePeriods)).toBe('Mar 2024');
  });

  it('mapea YYYY-C2 a "Ago YYYY"', () => {
    const periods: TranscriptPeriod[] = [
      { label: '2024-C2', year: 2024, number: 2, average: 0, items: [entry('A', 'Passed')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('Ago 2024');
  });

  it('mapea el año pelado (anual) a "YYYY anual"', () => {
    const periods: TranscriptPeriod[] = [
      { label: '2020', year: 2020, number: 1, average: 0, items: [entry('A', 'Passed')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('2020 anual');
  });

  it('devuelve el placeholder sobre vacío', () => {
    expect(firstPeriodLabel([])).toBe(NO_DATA);
  });

  it('salta el grupo sin período aunque sea el último del array', () => {
    const periods: TranscriptPeriod[] = [
      { label: '2024-C2', year: 2024, number: 2, average: 8, items: [entry('A', 'Passed', 8)] },
      { label: null, year: null, number: null, average: 10, items: [entry('B', 'Passed', 10)] },
    ];
    expect(firstPeriodLabel(periods)).toBe('Ago 2024');
  });

  it('devuelve el placeholder cuando todo el historial es el grupo sin período', () => {
    const periods: TranscriptPeriod[] = [
      { label: null, year: null, number: null, average: 10, items: [entry('A', 'Passed', 10)] },
    ];
    expect(firstPeriodLabel(periods)).toBe(NO_DATA);
  });

  it('devuelve el label crudo si el formato no matchea', () => {
    const periods: TranscriptPeriod[] = [
      { label: 'mid-2023', year: null, number: null, average: 0, items: [entry('A', 'Passed')] },
    ];
    expect(firstPeriodLabel(periods)).toBe('mid-2023');
  });
});

describe('buildSummary', () => {
  it('arma el objeto completo con los 4 KPIs', () => {
    expect(buildSummary(fixturePeriods)).toEqual({
      totalApproved: 5,
      overallAverage: '8.4',
      periodsCount: 3,
      firstPeriodLabel: 'Mar 2024',
    });
  });

  it('sobre array vacío devuelve valores nulos legibles', () => {
    expect(buildSummary([])).toEqual({
      totalApproved: 0,
      overallAverage: NO_DATA,
      periodsCount: 0,
      firstPeriodLabel: NO_DATA,
    });
  });
});
