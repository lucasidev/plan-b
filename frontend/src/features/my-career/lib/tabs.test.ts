import { describe, expect, it } from 'vitest';
import { MY_CAREER_TABS, parseTab } from './tabs';

describe('parseTab', () => {
  it('cae al default "plan" cuando value es undefined', () => {
    expect(parseTab(undefined)).toBe('plan');
  });

  it('cae al default "plan" cuando value es array (caso patológico de Next.js)', () => {
    expect(parseTab(['plan'])).toBe('plan');
  });

  it('cae al default "plan" cuando value es un id desconocido', () => {
    expect(parseTab('inventado')).toBe('plan');
  });

  it('devuelve el id tal cual cuando es válido', () => {
    expect(parseTab('prerequisites')).toBe('prerequisites');
    expect(parseTab('catalog')).toBe('catalog');
    expect(parseTab('teachers')).toBe('teachers');
    expect(parseTab('transcript')).toBe('transcript');
  });

  it('cubre los 5 ids del catálogo', () => {
    expect(MY_CAREER_TABS).toHaveLength(5);
    for (const t of MY_CAREER_TABS) {
      expect(parseTab(t.id)).toBe(t.id);
    }
  });
});
