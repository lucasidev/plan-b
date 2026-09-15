import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Crumb } from '@/components/layout/breadcrumbs';
import type { SubjectFacts } from '@/features/subject-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { universityCrumbByPlan } from '../../_lib/resolve-university';
import SubjectCrumbs from './page';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/features/subject-facts', () => ({ fetchSubjectFactsServer: vi.fn() }));
vi.mock('../../_lib/resolve-university', () => ({ universityCrumbByPlan: vi.fn() }));

// Sin esto, el conteo de llamadas de cada mock se arrastra entre tests: los que afirman
// `.not.toHaveBeenCalled()` fallarían por una llamada legítima de un test anterior.
beforeEach(() => {
  vi.clearAllMocks();
});

const UNIVERSITY_CRUMB: Crumb = { label: 'UNSTA', href: '/universities/unsta/careers' };

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

describe('SubjectCrumbs', () => {
  it('con la materia y la universidad resueltas, dibuja la cadena real', async () => {
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(facts());
    vi.mocked(universityCrumbByPlan).mockResolvedValue(UNIVERSITY_CRUMB);
    vi.mocked(usePathname).mockReturnValue('/subjects/subject-1');

    render(await SubjectCrumbs({ params: Promise.resolve({ id: 'subject-1' }) }));

    expect(screen.getByText('101 · Álgebra I')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UNSTA' })).toHaveAttribute(
      'href',
      '/universities/unsta/careers',
    );
  });

  it('materia inexistente (404, null): migas genéricas', async () => {
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(null);

    render(await SubjectCrumbs({ params: Promise.resolve({ id: 'subject-x' }) }));

    expect(screen.getByText('Materia')).toBeInTheDocument();
    expect(universityCrumbByPlan).not.toHaveBeenCalled();
  });

  it('universidad sin coincidencia: migas genéricas', async () => {
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(facts());
    vi.mocked(universityCrumbByPlan).mockResolvedValue(null);

    render(await SubjectCrumbs({ params: Promise.resolve({ id: 'subject-1' }) }));

    expect(screen.getByText('Materia')).toBeInTheDocument();
    expect(screen.queryByText('101 · Álgebra I')).not.toBeInTheDocument();
  });

  it('un pedido que falla no tira la página: migas genéricas', async () => {
    vi.mocked(fetchSubjectFactsServer).mockRejectedValue(
      new Error('Subject facts fetch failed: 500'),
    );

    render(await SubjectCrumbs({ params: Promise.resolve({ id: 'subject-1' }) }));

    expect(screen.getByText('Materia')).toBeInTheDocument();
  });
});
