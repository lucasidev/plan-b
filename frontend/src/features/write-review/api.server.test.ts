import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchChairsServer,
  fetchCurrentInstrumentServer,
  fetchPlanSubjectsServer,
  fetchTermsServer,
} from './api.server';

/**
 * Tests de los cuatro fetchers server-side de la pantalla Reseñar (US-146): mockean
 * `@/lib/api-client` (`apiFetch`) para controlar la Response sin pegarle a un backend real.
 */

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

const apiFetchMock = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchCurrentInstrumentServer', () => {
  it('pide el instrumento vigente sin cachear', async () => {
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify(null), { status: 200 }));

    await fetchCurrentInstrumentServer();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/reviews/instrument', { cache: 'no-store' });
  });

  it('devuelve null cuando todavía no se publicó ningún cuestionario (404)', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await fetchCurrentInstrumentServer();

    expect(result).toBeNull();
  });

  it('devuelve el cuestionario cuando el backend responde 200', async () => {
    const instrument = { code: 'course-review', version: 1, items: [] };
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify(instrument), { status: 200 }));

    const result = await fetchCurrentInstrumentServer();

    expect(result).toEqual(instrument);
  });

  it('tira con el status cuando el backend responde otro error', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchCurrentInstrumentServer()).rejects.toThrow('Instrument fetch failed: 500');
  });
});

describe('fetchPlanSubjectsServer', () => {
  it('pide las materias del plan con el careerPlanId en la query, sin cachear', async () => {
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await fetchPlanSubjectsServer('plan-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/academic/subjects?careerPlanId=plan-1', {
      cache: 'no-store',
    });
  });

  it('devuelve las materias que manda el backend', async () => {
    const subjects = [{ id: 's1', code: 'BD101', name: 'Bases de Datos', yearInPlan: 2 }];
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify(subjects), { status: 200 }));

    const result = await fetchPlanSubjectsServer('plan-1');

    expect(result).toEqual(subjects);
  });

  it('tira con el status cuando el backend responde error', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchPlanSubjectsServer('plan-1')).rejects.toThrow(
      'Plan subjects fetch failed: 500',
    );
  });
});

describe('fetchTermsServer', () => {
  it('pide los períodos con el universityId en la query, sin cachear', async () => {
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await fetchTermsServer('uni-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/academic/academic-terms?universityId=uni-1', {
      cache: 'no-store',
    });
  });

  it('devuelve los períodos que manda el backend', async () => {
    const terms = [{ id: 't1', label: '2026-C1' }];
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify(terms), { status: 200 }));

    const result = await fetchTermsServer('uni-1');

    expect(result).toEqual(terms);
  });

  it('tira con el status cuando el backend responde error', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchTermsServer('uni-1')).rejects.toThrow('Academic terms fetch failed: 500');
  });
});

describe('fetchChairsServer', () => {
  it('pide las cátedras de la materia, sin cachear', async () => {
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await fetchChairsServer('subj-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/academic/subjects/subj-1/chairs', {
      cache: 'no-store',
    });
  });

  it('devuelve las cátedras que manda el backend', async () => {
    const chairs = [
      { id: 'c1', name: 'Cátedra Pérez', leadFirstName: 'Ana', leadLastName: 'Pérez' },
    ];
    apiFetchMock.mockResolvedValue(new Response(JSON.stringify(chairs), { status: 200 }));

    const result = await fetchChairsServer('subj-1');

    expect(result).toEqual(chairs);
  });

  it('tira con el status cuando el backend responde error', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchChairsServer('subj-1')).rejects.toThrow('Chairs fetch failed: 500');
  });
});
