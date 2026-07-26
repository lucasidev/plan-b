import { describe, expect, it } from 'vitest';
import { pickDefaultTerm } from './default-term';

const NOW = new Date('2026-07-25T12:00:00Z');

describe('pickDefaultTerm', () => {
  it('hay futuro: elige el próximo (el de fecha de inicio futura más cercana)', () => {
    const result = pickDefaultTerm(
      [
        { id: 'pasado', startDate: '2026-03-09', endDate: '2026-07-04' },
        { id: 'futuro-lejano', startDate: '2027-03-08', endDate: '2027-07-04' },
        { id: 'futuro-cercano', startDate: '2026-08-03', endDate: '2026-11-28' },
      ],
      NOW,
    );
    expect(result).toBe('futuro-cercano');
  });

  it('no hay futuro pero hay uno en curso: elige el que contiene a "now"', () => {
    const result = pickDefaultTerm(
      [
        { id: 'pasado', startDate: '2025-08-04', endDate: '2025-11-29' },
        { id: 'en-curso', startDate: '2026-07-01', endDate: '2026-08-15' },
      ],
      NOW,
    );
    expect(result).toBe('en-curso');
  });

  it('ni futuro ni en curso: elige el más reciente (mayor fecha de inicio entre los pasados)', () => {
    const result = pickDefaultTerm(
      [
        { id: 'mas-viejo', startDate: '2025-03-10', endDate: '2025-07-05' },
        { id: 'mas-reciente', startDate: '2025-08-04', endDate: '2025-11-29' },
      ],
      NOW,
    );
    expect(result).toBe('mas-reciente');
  });

  it('lista vacía: devuelve null', () => {
    expect(pickDefaultTerm([], NOW)).toBeNull();
  });
});
