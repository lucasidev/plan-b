import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChairFacts, ChairSibling } from '@/features/chair-facts';
import { fetchChairFactsServer } from '@/features/chair-facts';
import type { SubjectFacts } from '@/features/subject-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import ChairPage from './page';

vi.mock('@/features/chair-facts', () => ({
  fetchChairFactsServer: vi.fn(),
  ChairFactsSheet: ({ siblings }: { siblings: ChairSibling[] }) => (
    <ul>
      {siblings.map((s) => (
        <li key={s.chairId}>
          {s.chairName}: {s.reviewCount}
        </li>
      ))}
    </ul>
  ),
}));
vi.mock('@/features/subject-facts', () => ({ fetchSubjectFactsServer: vi.fn() }));
vi.mock('@/features/write-review', () => ({ reviewCtaHref: () => '/reviews/new' }));
vi.mock('@/lib/session', () => ({ getSession: vi.fn().mockResolvedValue(null) }));

// clearAllMocks (no resetAllMocks): limpia el conteo de llamadas entre tests sin tocar el
// mockResolvedValue fijado arriba para getSession.
beforeEach(() => {
  vi.clearAllMocks();
});

function chairFacts(over: Partial<ChairFacts> = {}): ChairFacts {
  return {
    chairId: 'chair-1',
    chairName: 'Pérez',
    subjectId: 'subject-1',
    subjectName: 'Álgebra I',
    subjectCode: '101',
    leadTeacherName: null,
    leadTeacherId: null,
    isPublished: true,
    reviewCount: 37,
    reviewsMissingToPublish: 0,
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

function subjectChair(
  over: Partial<SubjectFacts['chairs'][number]> = {},
): SubjectFacts['chairs'][number] {
  return {
    chairId: 'sibling',
    chairName: 'Sibling',
    reviewCount: 5,
    isPublished: false,
    reviewsMissingToPublish: 5,
    lastReviewedAt: null,
    leadTeacherName: null,
    headline: null,
    ...over,
  };
}

function subjectFacts(chairs: SubjectFacts['chairs']): SubjectFacts {
  return {
    subjectId: 'subject-1',
    subjectCode: '101',
    subjectName: 'Álgebra I',
    yearInPlan: 1,
    careerPlanId: 'plan-1',
    careerId: 'career-1',
    careerName: 'Tecnicatura',
    universityName: 'UNSTA',
    isPublished: true,
    totalVoices: 0,
    publishingChairs: 0,
    chairsBelowFloor: 0,
    span: null,
    completion: null,
    enablesCount: 0,
    spread: [],
    shared: [],
    takenWith: [],
    chairs,
  };
}

/**
 * El filtro de "Las hermanas" (chairs/[id]/page.tsx): se excluye a sí misma y a las que todavía no
 * juntan ninguna reseña, porque "0 reseñas" no es una hermana para comparar, es la materia entera
 * sin dato.
 */
describe('ChairPage: filtro de hermanas', () => {
  it('excluye a la propia cátedra y a las que tienen 0 reseñas', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(chairFacts({ chairId: 'chair-1' }));
    vi.mocked(fetchSubjectFactsServer).mockResolvedValue(
      subjectFacts([
        subjectChair({ chairId: 'chair-1', chairName: 'Pérez', reviewCount: 37 }),
        subjectChair({ chairId: 'chair-2', chairName: 'González', reviewCount: 12 }),
        subjectChair({ chairId: 'chair-3', chairName: 'Sin voces', reviewCount: 0 }),
      ]),
    );

    render(await ChairPage({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.getByText('González: 12')).toBeInTheDocument();
    expect(screen.queryByText(/Pérez/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sin voces/)).not.toBeInTheDocument();
  });

  it('sin ficha de materia (falló o no existe), no hay hermanas', async () => {
    vi.mocked(fetchChairFactsServer).mockResolvedValue(chairFacts({ chairId: 'chair-1' }));
    vi.mocked(fetchSubjectFactsServer).mockRejectedValue(
      new Error('Subject facts fetch failed: 500'),
    );

    render(await ChairPage({ params: Promise.resolve({ id: 'chair-1' }) }));

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
