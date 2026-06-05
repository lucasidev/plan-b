import { describe, expect, it } from 'vitest';
import { MI_CARRERA_TABS, parseTab } from './tabs';

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
    expect(parseTab('correlativas')).toBe('correlativas');
    expect(parseTab('catalogo')).toBe('catalogo');
    expect(parseTab('docentes')).toBe('docentes');
    expect(parseTab('historial')).toBe('historial');
  });

  it('cubre los 5 ids del catálogo', () => {
    expect(MI_CARRERA_TABS).toHaveLength(5);
    for (const t of MI_CARRERA_TABS) {
      expect(parseTab(t.id)).toBe(t.id);
    }
  });
});
