import { describe, expect, it } from 'vitest';
import { formatShortDate } from './format-date';

describe('formatShortDate', () => {
  it('formatea como dd/mm/aaaa', () => {
    // Mediodía UTC: evita que un huso horario negativo corra la fecha local un día para atrás.
    expect(formatShortDate('2026-09-07T12:00:00Z')).toBe('07/09/2026');
  });

  it('rellena con cero los días y meses de un solo dígito', () => {
    expect(formatShortDate('2026-01-05T12:00:00Z')).toBe('05/01/2026');
  });
});
