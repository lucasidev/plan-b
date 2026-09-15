import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Crumb } from '@/components/layout/breadcrumbs';
import type { ChairFacts } from '@/features/chair-facts';
import { fetchChairFactsServer } from '@/features/chair-facts';
import type { SubjectFacts } from '@/features/subject-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { universityCrumbByPlan } from '../../_lib/resolve-university';
import ChairCrumbs from './page';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/features/chair-facts', () => ({ fetchChairFactsServer: vi.fn() }));
vi.mock('@/features/subject-facts', () => ({ fetchSubjectFactsServer: vi.fn() }));
vi.mock('../../_lib/resolve-university', () => ({ universityCrumbByPlan: vi.fn() }));

// Sin esto, el conteo de llamadas de cada mock se arrastra entre tests: los que afirman
// `.not.toHaveBeenCalled()` fallarían por una llamada legítima de un test anterior.
beforeEach(() => {
  vi.clearAllMocks();
});

const UNIVERSITY_CRUMB: Crumb = { label: 'UNSTA', href: '/universities/unsta/careers' };

function chairFacts(over: Partial<ChairFacts> = {}): ChairFacts {
  return {
    chairId: 'chair-1',
    chairName: 'Pérez',
    subjectId: 'subject-1',
    subjectName: 'Álgebra I',
    subjectCode: '101',
    leadTeacherName: null,
    leadTeacherId: null,
    isPublished: false,
    reviewCount: 0,
    reviewsMissingToPublish: 10,
    span: null,
    fame: null,
    chairConduct: [],
    studentExperience: [],
    completion: null,
    contrasts: [],
    hasDemoCorpusVoices: false,
    ...over,
  };
}

function subjectFacts(over: Partial<SubjectFacts> = {}): SubjectFacts {
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

describe('ChairCrumbs', () => {
  it('con la cátedra, la materia y la universidad resueltas, dibuja la cadena real', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(chairFacts());
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(subjectFacts());
    vi.mocked(universityCrumbByPlan).mockResolvedValue(UNIVERSITY_CRUMB);
    vi.mocked(usePathname).mockReturnValue('/chairs/chair-1');

    render(await ChairCrumbs({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.getByText('Cátedra Pérez')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UNSTA' })).toHaveAttribute(
      'href',
      '/universities/unsta/careers',
    );
  });

  it('cátedra inexistente (404, null): migas genéricas', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(null);

    render(await ChairCrumbs({ params: Promise.resolve({ id: 'chair-x' }) }));

    expect(screen.getByText('Cátedra')).toBeInTheDocument();
    expect(fetchSubjectFactsServer).not.toHaveBeenCalled();
  });

  it('la ficha de materia falla o no existe: migas genéricas', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(chairFacts());
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(null);

    render(await ChairCrumbs({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.getByText('Cátedra')).toBeInTheDocument();
    expect(universityCrumbByPlan).not.toHaveBeenCalled();
  });

  it('universidad sin coincidencia: migas genéricas', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(chairFacts());
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(subjectFacts());
    vi.mocked(universityCrumbByPlan).mockResolvedValue(null);

    render(await ChairCrumbs({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.getByText('Cátedra')).toBeInTheDocument();
    expect(screen.queryByText('Cátedra Pérez')).not.toBeInTheDocument();
  });

  it('un pedido que falla no tira la página: migas genéricas', async () => {
    vi.mocked(fetchChairFactsServer).mockRejectedValue(new Error('Chair facts fetch failed: 500'));

    render(await ChairCrumbs({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.getByText('Cátedra')).toBeInTheDocument();
  });
});
