import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientApiFetch } from './api-client';

/**
 * Cubre la guarda de `clientApiFetch` (rama "Utils" de la pirámide, ADR-0036).
 *
 * Los fetchers client de `features/<feature>/api.ts` usan paths relativos `/api/...` que
 * solo resuelven en el browser. Si una query corre su `queryFn` server-side (vía
 * fetchOptimistic bajo ReactQueryStreamedHydration), el fetch relativo rechaza. El framework
 * tolera ese rechazo (refetch en el cliente), así que el helper NO tira: loguea un error
 * descriptivo que nombra el invariante y el fix, y delega al mismo `fetch` de siempre. Tirar
 * acá escalaría un transitorio tolerado a un error fatal de RSC.
 */
describe('clientApiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loguea un error descriptivo si corre server-side, sin tirar', async () => {
    vi.stubGlobal('window', undefined);
    const response = new Response('{}', { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchSpy);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await clientApiFetch('/api/reviews/me/pending');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('clientApiFetch ran on the server'),
    );
    // No tira: delega al fetch (el rechazo natural lo maneja React Query, no nosotros).
    expect(fetchSpy).toHaveBeenCalledWith('/api/reviews/me/pending', undefined);
    expect(result).toBe(response);
  });

  it('nombra el path en el log para que el fix sea obvio', async () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await clientApiFetch('/api/academic/universities');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('/api/academic/universities'));
  });

  it('delega a fetch con el path relativo + init en el browser, sin loguear', async () => {
    const response = new Response('{}', { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchSpy);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const init: RequestInit = { cache: 'no-store' };
    const result = await clientApiFetch('/api/reviews?page=0', init);

    expect(fetchSpy).toHaveBeenCalledWith('/api/reviews?page=0', init);
    expect(result).toBe(response);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
