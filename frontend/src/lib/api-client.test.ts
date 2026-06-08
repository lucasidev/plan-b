import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientApiFetch } from './api-client';

/**
 * Cubre la guarda de `clientApiFetch` (rama "Utils" de la pirámide, ADR-0036).
 *
 * Los fetchers client de `features/<feature>/api.ts` usan paths relativos `/api/...` que
 * solo resuelven en el browser. Si una query corre su `queryFn` server-side (no hidratada
 * bajo ReactQueryStreamedHydration), Node tira el críptico "Failed to parse URL". El helper
 * convierte ese caso en un error descriptivo inmediato que nombra el invariante y el fix.
 */
describe('clientApiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('tira un error descriptivo si corre server-side (sin window)', () => {
    vi.stubGlobal('window', undefined);

    expect(() => clientApiFetch('/api/reviews/me/pending')).toThrow(
      /clientApiFetch ran on the server/,
    );
  });

  it('nombra el path en el error para que el fix sea obvio', () => {
    vi.stubGlobal('window', undefined);

    expect(() => clientApiFetch('/api/academic/universities')).toThrow(
      /\/api\/academic\/universities/,
    );
  });

  it('delega a fetch con el path relativo + init en el browser', async () => {
    const response = new Response('{}', { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchSpy);

    const init: RequestInit = { cache: 'no-store' };
    const result = await clientApiFetch('/api/reviews?page=0', init);

    expect(fetchSpy).toHaveBeenCalledWith('/api/reviews?page=0', init);
    expect(result).toBe(response);
  });
});
