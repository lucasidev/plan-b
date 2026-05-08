import { describe, expect, it } from 'vitest';
import { greetingNameFromEmail } from './greeting';

describe('greetingNameFromEmail', () => {
  it('capitaliza el chunk antes del primer punto del local', () => {
    expect(greetingNameFromEmail('lucia.mansilla@gmail.com')).toBe('Lucia');
  });

  it('capitaliza el local entero cuando no tiene punto', () => {
    expect(greetingNameFromEmail('mateo@hotmail.com')).toBe('Mateo');
  });

  it('toma solo el primer chunk si hay múltiples puntos', () => {
    expect(greetingNameFromEmail('martin.de.la.cruz@planb.local')).toBe('Martin');
  });

  it('preserva el resto del local en minúsculas (no toca después de la primera letra)', () => {
    expect(greetingNameFromEmail('LUCIA.mansilla@gmail.com')).toBe('LUCIA');
  });

  it('devuelve el email completo si el local está vacío (caso defensivo)', () => {
    expect(greetingNameFromEmail('@gmail.com')).toBe('@gmail.com');
  });
});
