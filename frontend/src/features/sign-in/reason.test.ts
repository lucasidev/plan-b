import { describe, expect, it } from 'vitest';
import { resolveSignInGate } from './reason';

/**
 * US-229. E1: el gate manda a reseñar y la pantalla dice el motivo con esas palabras. E3: sin
 * acción que lo trajera, no hay motivo. El caso del host externo cubre "cuidado con lo obvio":
 * un `from` no confiable no debe colarse como si fuera una acción reconocida.
 */
describe('resolveSignInGate', () => {
  it('E1: reconoce el gate de reseñar y da su motivo exacto', () => {
    expect(resolveSignInGate('/reviews/new')).toEqual({
      from: '/reviews/new',
      reason: 'Para reseñar una cursada, necesitás una cuenta.',
    });
  });

  it('E3: sin from, no hay ruta ni motivo', () => {
    expect(resolveSignInGate(undefined)).toEqual({ from: null, reason: null });
  });

  it('un from externo no cuela como acción reconocida', () => {
    expect(resolveSignInGate('https://evil.com')).toEqual({ from: null, reason: null });
  });

  it('un from interno sin motivo mapeado vuelve como ruta sana, sin texto', () => {
    expect(resolveSignInGate('/my-profile')).toEqual({ from: '/my-profile', reason: null });
  });
});
