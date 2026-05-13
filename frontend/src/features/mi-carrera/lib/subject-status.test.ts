import { describe, expect, it } from 'vitest';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import { approvedCodes, isUnlocked, missingCorrelativas, stateLabel } from './subject-status';

const subject = (
  code: string,
  state: 'AP' | 'CU' | 'PD',
  correlativas: string[] = [],
): PlannedSubject => ({
  code,
  name: code,
  modality: '1c',
  state,
  grade: state === 'AP' ? 8 : null,
  correlativas,
});

const planFixture: PlanYear[] = [
  {
    year: 1,
    subjects: [subject('A', 'AP'), subject('B', 'AP')],
  },
  {
    year: 2,
    subjects: [
      subject('C', 'CU', ['A']),
      subject('D', 'PD', ['A', 'B']),
      subject('E', 'PD', ['A', 'Z']),
    ],
  },
];

describe('approvedCodes', () => {
  it('devuelve el set de códigos AP del plan completo', () => {
    expect(approvedCodes(planFixture)).toEqual(new Set(['A', 'B']));
  });

  it('devuelve set vacío si nada está aprobado', () => {
    expect(approvedCodes([{ year: 1, subjects: [subject('X', 'PD')] }])).toEqual(new Set());
  });
});

describe('missingCorrelativas', () => {
  it('devuelve solo las correlativas que el alumno no tiene', () => {
    const approved = approvedCodes(planFixture);
    expect(missingCorrelativas(subject('X', 'PD', ['A', 'Z']), approved)).toEqual(['Z']);
  });

  it('devuelve array vacío cuando todas las correlativas están aprobadas', () => {
    const approved = approvedCodes(planFixture);
    expect(missingCorrelativas(subject('X', 'PD', ['A', 'B']), approved)).toEqual([]);
  });

  it('devuelve array vacío si la materia no tiene correlativas', () => {
    expect(missingCorrelativas(subject('X', 'PD', []), new Set())).toEqual([]);
  });
});

describe('isUnlocked', () => {
  it('es true cuando todas las correlativas están aprobadas', () => {
    expect(isUnlocked(subject('X', 'PD', ['A', 'B']), approvedCodes(planFixture))).toBe(true);
  });

  it('es false cuando falta al menos una correlativa', () => {
    expect(isUnlocked(subject('X', 'PD', ['A', 'Z']), approvedCodes(planFixture))).toBe(false);
  });

  it('es true para materias sin correlativas', () => {
    expect(isUnlocked(subject('X', 'PD', []), new Set())).toBe(true);
  });
});

describe('stateLabel', () => {
  it('mapea cada state a su copy human-readable', () => {
    expect(stateLabel.AP).toBe('Aprobada');
    expect(stateLabel.CU).toBe('Cursando');
    expect(stateLabel.PD).toBe('Pendiente');
  });
});
