import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fetchPlanServer, fetchSubjectsByPlanServer } from '@/features/browse-catalog/api.server';
import type { SubjectFacts } from '@/features/subject-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import SubjectPage from './page';

vi.mock('@/features/browse-catalog/api.server', () => ({
  fetchPlanServer: vi.fn(),
  fetchSubjectsByPlanServer: vi.fn(),
}));
vi.mock('@/features/subject-facts', () => ({
  fetchSubjectFactsServer: vi.fn(),
  SubjectFactsSheet: ({ planYear }: { planYear?: number }) => (
    <p>{planYear ? `del plan ${planYear}` : 'sin año de plan'}</p>
  ),
}));

function facts(over: Partial<SubjectFacts> = {}): SubjectFacts {
  return {
    subjectId: 'subject-1',
    subjectCode: '101',
    subjectName: 'Álgebra I',
    yearInPlan: 1,
    careerPlanId: 'plan-1',
    careerId: 'career-1',
    careerName: 'Tecnicatura',
    universityName: 'UNSTA',
    isPublished: false,
    totalVoices: 0,
    publishingChairs: 0,
    chairsBelowFloor: 0,
    span: null,
    completion: null,
    enablesCount: 0,
    spread: [],
    shared: [],
    takenWith: [],
    chairs: [],
    ...over,
  };
}

/**
 * El año del plan es un tercer pedido, independiente del resto de la ficha (subjects/[id]/page.tsx:44):
 * si falla, el eyebrow se queda sin "del plan {año}" en vez de tirar abajo la ficha entera por un
 * dato que no es el centro de la pantalla.
 */
describe('SubjectPage: .catch del plan', () => {
  it('con el plan resuelto, pasa su año a la ficha', async () => {
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(facts());
    vi.mocked(fetchSubjectsByPlanServer).mockResolvedValue([]);
    vi.mocked(fetchPlanServer).mockResolvedValue({
      id: 'plan-1',
      careerId: 'career-1',
      universityId: 'uni-1',
      year: 2018,
    });

    render(await SubjectPage({ params: Promise.resolve({ id: 'subject-1' }) }));

    expect(screen.getByText('del plan 2018')).toBeInTheDocument();
  });

  it('con el pedido del plan fallando, la ficha se sigue mostrando sin el año', async () => {
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(facts());
    vi.mocked(fetchSubjectsByPlanServer).mockResolvedValue([]);
    vi.mocked(fetchPlanServer).mockRejectedValue(new Error('Career plan fetch failed: 500'));

    render(await SubjectPage({ params: Promise.resolve({ id: 'subject-1' }) }));

    expect(screen.getByText('sin año de plan')).toBeInTheDocument();
  });
});
