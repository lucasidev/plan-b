import { describe, expect, it } from 'vitest';
import { formatCommissionModality, formatScheduleSummary } from './commission-format';

describe('formatCommissionModality', () => {
  it('traduce las tres modalidades conocidas', () => {
    expect(formatCommissionModality('Presencial')).toBe('Presencial');
    expect(formatCommissionModality('Virtual')).toBe('Virtual');
    expect(formatCommissionModality('Hibrida')).toBe('Híbrida');
  });

  it('degrada al valor crudo si no conoce la modalidad', () => {
    expect(formatCommissionModality('Semipresencial')).toBe('Semipresencial');
  });
});

describe('formatScheduleSummary', () => {
  it('sin franjas: lo dice explícito', () => {
    expect(formatScheduleSummary([])).toBe('sin horario cargado');
  });

  it('una franja: día abreviado + horario sin minutos en punto', () => {
    expect(formatScheduleSummary([{ day: 'Monday', start: '18:00', end: '22:00' }])).toBe(
      'Lu 18-22',
    );
  });

  it('agrupa días distintos con el mismo horario', () => {
    expect(
      formatScheduleSummary([
        { day: 'Monday', start: '18:00', end: '21:00' },
        { day: 'Wednesday', start: '18:00', end: '21:00' },
      ]),
    ).toBe('Lu/Mi 18-21');
  });

  it('separa con coma los grupos con horarios distintos', () => {
    expect(
      formatScheduleSummary([
        { day: 'Tuesday', start: '18:00', end: '22:00' },
        { day: 'Thursday', start: '14:00', end: '18:00' },
      ]),
    ).toBe('Ma 18-22, Ju 14-18');
  });

  it('conserva los minutos cuando el horario no es en punto', () => {
    expect(formatScheduleSummary([{ day: 'Friday', start: '18:30', end: '20:00' }])).toBe(
      'Vi 18:30-20',
    );
  });

  it('ordena por día aunque el input llegue desordenado', () => {
    expect(
      formatScheduleSummary([
        { day: 'Friday', start: '14:00', end: '18:00' },
        { day: 'Monday', start: '14:00', end: '18:00' },
      ]),
    ).toBe('Lu/Vi 14-18');
  });
});
