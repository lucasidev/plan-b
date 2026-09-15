import { describe, expect, it } from 'vitest';
import { subjectLabel } from './subject-label';

describe('subjectLabel', () => {
  it('con código, arma "código · nombre"', () => {
    expect(subjectLabel('211', 'Análisis Matemático II')).toBe('211 · Análisis Matemático II');
  });

  it('sin código, devuelve solo el nombre, sin separador colgando', () => {
    expect(subjectLabel(null, 'Análisis Matemático II')).toBe('Análisis Matemático II');
  });
});
