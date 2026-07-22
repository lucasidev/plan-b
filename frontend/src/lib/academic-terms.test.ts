import { describe, expect, it } from 'vitest';
import { formatAcademicPeriod, formatTermOfYear } from './academic-terms';

/**
 * Tests del formato canónico de períodos (tier "Utils / Schemas", ADR-0036).
 *
 * El caso que motivó todo esto está en "no codifica la cadencia en una letra": el SQL de pendientes
 * concatenaba una 'c' fija, así que un bimestre se mostraba como "3c". Acá cada cadencia tiene que
 * decir su propio nombre.
 */
describe('formatTermOfYear', () => {
  it('nombra la cadencia completa', () => {
    expect(formatTermOfYear('FourMonth', 1)).toBe('1er cuatrimestre');
    expect(formatTermOfYear('TwoMonth', 3)).toBe('3er bimestre');
    expect(formatTermOfYear('SixMonth', 2)).toBe('2do semestre');
  });

  it('no codifica la cadencia en una letra', () => {
    // La regresión concreta: un bimestre nunca puede salir con la 'c' de cuatrimestre.
    expect(formatTermOfYear('TwoMonth', 3)).not.toContain('c');
    expect(formatTermOfYear('SixMonth', 1)).not.toMatch(/^\ds$/);
    expect(formatTermOfYear('FourMonth', 1)).not.toBe('1c');
  });

  it('trata la materia anual sin número de término', () => {
    expect(formatTermOfYear('FullYear', null)).toBe('anual');
    // Aunque llegue un número, "anual" manda: el invariante lo garantiza el aggregate.
    expect(formatTermOfYear('FullYear', 1)).toBe('anual');
  });

  it('trata un número ausente como anual', () => {
    expect(formatTermOfYear('FourMonth', null)).toBe('anual');
    expect(formatTermOfYear('FourMonth', undefined)).toBe('anual');
  });

  it('abrevia sin volverse críptico', () => {
    expect(formatTermOfYear('FourMonth', 1, { short: true })).toBe('1er cuatri');
    expect(formatTermOfYear('TwoMonth', 4, { short: true })).toBe('4to bim');
    expect(formatTermOfYear('SixMonth', 2, { short: true })).toBe('2do sem');
  });

  it('usa el ordinal genérico más allá del sexto término', () => {
    expect(formatTermOfYear('TwoMonth', 7)).toBe('7° bimestre');
  });

  it('degrada legible ante una cadencia desconocida', () => {
    // Preferimos mostrar el dato crudo antes que inventar una cadencia que el backend no mandó.
    expect(formatTermOfYear('Trimestral', 2)).toBe('2° trimestral');
  });
});

describe('formatAcademicPeriod', () => {
  it('arma el período completo', () => {
    expect(formatAcademicPeriod(2025, 'FourMonth', 2)).toBe('2025 · 2do cuatrimestre');
    expect(formatAcademicPeriod(2026, 'TwoMonth', 1, { short: true })).toBe('2026 · 1er bim');
  });

  it('no inventa un período cuando no hay dato', () => {
    // Cursadas viejas sin término vinculado: null deja que el consumidor omita el dato.
    expect(formatAcademicPeriod(null, 'FourMonth', 1)).toBeNull();
    expect(formatAcademicPeriod(undefined, null, null)).toBeNull();
  });

  it('devuelve solo el año cuando no se conoce la cadencia', () => {
    expect(formatAcademicPeriod(2025, null, null)).toBe('2025');
  });

  it('muestra el año con la cadencia anual', () => {
    expect(formatAcademicPeriod(2025, 'FullYear', null)).toBe('2025 · anual');
  });
});
