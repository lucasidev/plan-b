import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CareerCoverage,
  CareerPlanSummary,
  University,
} from '@/features/browse-catalog/types';
import { universityCrumbByCareer, universityCrumbByPlan } from './resolve-university';

vi.mock('@/features/browse-catalog/api.server', () => ({
  fetchUniversitiesServer: vi.fn(),
  fetchPlanServer: vi.fn(),
  fetchCatalogCoverageServer: vi.fn(),
}));

import {
  fetchCatalogCoverageServer,
  fetchPlanServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

// Sin esto, el conteo de llamadas de cada mock se arrastra entre tests: los que afirman
// `.not.toHaveBeenCalled()` fallarían por una llamada legítima de un test anterior.
beforeEach(() => {
  vi.clearAllMocks();
});

const UNSTA: University = { id: 'uni-1', name: 'Universidad del Norte', slug: 'unsta' };

function plan(over: Partial<CareerPlanSummary> = {}): CareerPlanSummary {
  return { id: 'plan-1', careerId: 'career-1', universityId: 'uni-1', year: 2018, ...over };
}

function coverage(over: Partial<CareerCoverage> = {}): CareerCoverage {
  return {
    careerId: 'career-1',
    careerName: 'Tecnicatura',
    universityId: 'uni-1',
    universityName: UNSTA.name,
    isOfficial: true,
    hasOfficialData: true,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...over,
  };
}

describe('universityCrumbByPlan', () => {
  it('resuelve la universidad por el universityId que trae el plan', async () => {
    vi.mocked(fetchPlanServer).mockResolvedValue(plan());
    vi.mocked(fetchUniversitiesServer).mockResolvedValue([UNSTA]);

    const crumb = await universityCrumbByPlan('plan-1');

    expect(crumb).toEqual({ label: 'UNSTA', href: '/universities/unsta/careers' });
  });

  it('el plan inexistente (404, null) devuelve null', async () => {
    vi.mocked(fetchPlanServer).mockResolvedValue(null);

    expect(await universityCrumbByPlan('plan-x')).toBeNull();
    expect(fetchUniversitiesServer).not.toHaveBeenCalled();
  });

  it('un universityId que no matchea ninguna universidad devuelve null', async () => {
    vi.mocked(fetchPlanServer).mockResolvedValue(plan({ universityId: 'uni-otra' }));
    vi.mocked(fetchUniversitiesServer).mockResolvedValue([UNSTA]);

    expect(await universityCrumbByPlan('plan-1')).toBeNull();
  });

  it('un pedido que falla devuelve null en vez de propagar el error', async () => {
    vi.mocked(fetchPlanServer).mockRejectedValue(new Error('Career plan fetch failed: 500'));

    expect(await universityCrumbByPlan('plan-1')).toBeNull();
  });

  it('un pedido de universidades que falla devuelve null en vez de propagar el error', async () => {
    vi.mocked(fetchPlanServer).mockResolvedValue(plan());
    vi.mocked(fetchUniversitiesServer).mockRejectedValue(
      new Error('Universities fetch failed: 500'),
    );

    expect(await universityCrumbByPlan('plan-1')).toBeNull();
  });
});

describe('universityCrumbByCareer', () => {
  it('resuelve la universidad por el universityId que trae la cobertura del catálogo', async () => {
    vi.mocked(fetchCatalogCoverageServer).mockResolvedValue([coverage()]);
    vi.mocked(fetchUniversitiesServer).mockResolvedValue([UNSTA]);

    const crumb = await universityCrumbByCareer('career-1');

    expect(crumb).toEqual({ label: 'UNSTA', href: '/universities/unsta/careers' });
  });

  it('una carrera que no aparece en la cobertura devuelve null', async () => {
    vi.mocked(fetchCatalogCoverageServer).mockResolvedValue([]);

    expect(await universityCrumbByCareer('career-x')).toBeNull();
  });

  it('un pedido que falla devuelve null en vez de propagar el error', async () => {
    vi.mocked(fetchCatalogCoverageServer).mockRejectedValue(
      new Error('Catalog coverage fetch failed: 500'),
    );

    expect(await universityCrumbByCareer('career-1')).toBeNull();
  });
});
