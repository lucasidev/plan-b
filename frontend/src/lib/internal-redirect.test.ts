import { describe, expect, it } from 'vitest';
import { sanitizeInternalRedirect } from './internal-redirect';

/**
 * US-229, "cuidado con lo obvio": el destino de vuelta viene del cliente, así que estos casos
 * negativos son el corazón del test, no un adorno. Un test que solo confirma el camino feliz no
 * demuestra que el open-redirect esté cerrado.
 */
describe('sanitizeInternalRedirect', () => {
  it('acepta una ruta interna simple', () => {
    expect(sanitizeInternalRedirect('/reviews/new')).toBe('/reviews/new');
  });

  it('conserva query y hash de una ruta interna', () => {
    expect(sanitizeInternalRedirect('/reviews/new?chairId=1#top')).toBe(
      '/reviews/new?chairId=1#top',
    );
  });

  it('rechaza vacío, null o undefined', () => {
    expect(sanitizeInternalRedirect('')).toBeNull();
    expect(sanitizeInternalRedirect(null)).toBeNull();
    expect(sanitizeInternalRedirect(undefined)).toBeNull();
  });

  it('rechaza un host externo absoluto', () => {
    expect(sanitizeInternalRedirect('https://evil.com/phish')).toBeNull();
  });

  it('rechaza una URL protocol-relative', () => {
    expect(sanitizeInternalRedirect('//evil.com')).toBeNull();
  });

  it('rechaza el truco de la barra invertida', () => {
    expect(sanitizeInternalRedirect('/\\evil.com')).toBeNull();
  });

  it('rechaza un scheme sin barra inicial', () => {
    expect(sanitizeInternalRedirect('javascript:alert(1)')).toBeNull();
  });

  it('rechaza una ruta relativa sin barra inicial', () => {
    expect(sanitizeInternalRedirect('reviews/new')).toBeNull();
  });
});
