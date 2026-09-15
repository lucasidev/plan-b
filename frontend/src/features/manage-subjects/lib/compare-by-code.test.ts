import { describe, expect, it } from 'vitest';
import { compareByCodeThenName } from './compare-by-code';

describe('compareByCodeThenName', () => {
  it('ordena por código cuando las dos materias lo tienen', () => {
    const a = { code: 'MAT201', name: 'Análisis Matemático II' };
    const b = { code: 'PRG201', name: 'Programación II' };

    expect(compareByCodeThenName(a, b)).toBeLessThan(0);
    expect(compareByCodeThenName(b, a)).toBeGreaterThan(0);
  });

  it('una materia sin código va después de una con código, sin importar el nombre', () => {
    const withCode = { code: 'AAA000', name: 'Zetamateria' };
    const withoutCode = { code: null, name: 'Amateria' };

    expect(compareByCodeThenName(withoutCode, withCode)).toBeGreaterThan(0);
    expect(compareByCodeThenName(withCode, withoutCode)).toBeLessThan(0);
  });

  it('con las dos sin código, desempata por nombre', () => {
    const a = { code: null, name: 'Álgebra' };
    const b = { code: null, name: 'Cálculo' };

    expect(compareByCodeThenName(a, b)).toBeLessThan(0);
    expect(compareByCodeThenName(a, a)).toBe(0);
  });
});
