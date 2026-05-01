import { describe, expect, it } from 'vitest';
import { cn } from './utils';

/**
 * Sample test for the utils-layer helper. Cubre la rama "Utils / Schemas"
 * de la pirámide (ADR-0036): lógica pura sin DOM ni network.
 *
 * `cn` mergea clases via clsx + tailwind-merge: tolera falsy, dedupea
 * conflictos de Tailwind (ej. `px-2 px-4` → `px-4`).
 */
describe('cn', () => {
  it('mergea strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora valores falsy', () => {
    expect(cn('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  it('soporta arrays anidados', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('soporta objects con keys condicionales (clsx)', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('dedupea clases conflictivas de Tailwind', () => {
    // tailwind-merge resuelve a la última de cada categoría utilitaria.
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});
