import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Crumb } from '@/components/layout/breadcrumbs';
import type { CareerFacts } from '@/features/career-facts';
import { fetchCareerFactsServer } from '@/features/career-facts';
import { universityCrumbByCareer } from '../../_lib/resolve-university';
import CareerCrumbs from './page';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('@/features/career-facts', () => ({ fetchCareerFactsServer: vi.fn() }));
vi.mock('../../_lib/resolve-university', () => ({ universityCrumbByCareer: vi.fn() }));

// Sin esto, el conteo de llamadas de cada mock se arrastra entre tests: los que afirman
// `.not.toHaveBeenCalled()` fallarían por una llamada legítima de un test anterior.
beforeEach(() => {
  vi.clearAllMocks();
});

const UNIVERSITY_CRUMB: Crumb = { label: 'UNSTA', href: '/universities/unsta/careers' };

function careerFacts(over: Partial<CareerFacts> = {}): CareerFacts {
  return {
    careerId: 'career-1',
    careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    universityName: 'UNSTA',
    academicUnitName: null,
    durationYears: 3,
    totalSubjects: 0,
    coveredSubjects: 0,
    coveragePercent: 0,
    editorialNotes: [],
    ...over,
  };
}

describe('CareerCrumbs', () => {
  it('con la carrera y la universidad resueltas, dibuja la cadena real', async () => {
    vi.mocked(fetchCareerFactsServer).mockResolvedValue(careerFacts());
    vi.mocked(universityCrumbByCareer).mockResolvedValue(UNIVERSITY_CRUMB);
    vi.mocked(usePathname).mockReturnValue('/careers/career-1');

    render(await CareerCrumbs({ params: Promise.resolve({ id: 'career-1' }) }));

    expect(
      screen.getByText('Tecnicatura Universitaria en Desarrollo y Calidad de Software'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UNSTA' })).toHaveAttribute(
      'href',
      '/universities/unsta/careers',
    );
  });

  it('con facultad, agrega esa miga con el mismo link que la universidad', async () => {
    vi.mocked(fetchCareerFactsServer).mockResolvedValue(
      careerFacts({ academicUnitName: 'Facultad de Ingeniería' }),
    );
    vi.mocked(universityCrumbByCareer).mockResolvedValue(UNIVERSITY_CRUMB);
    vi.mocked(usePathname).mockReturnValue('/careers/career-1');

    render(await CareerCrumbs({ params: Promise.resolve({ id: 'career-1' }) }));

    expect(screen.getByRole('link', { name: 'Facultad de Ingeniería' })).toHaveAttribute(
      'href',
      '/universities/unsta/careers',
    );
  });

  it('carrera inexistente (404, null): migas genéricas', async () => {
    vi.mocked(fetchCareerFactsServer).mockResolvedValue(null);

    render(await CareerCrumbs({ params: Promise.resolve({ id: 'career-x' }) }));

    expect(screen.getByText('Carrera')).toBeInTheDocument();
    expect(universityCrumbByCareer).not.toHaveBeenCalled();
  });

  it('universidad sin coincidencia: migas genéricas', async () => {
    vi.mocked(fetchCareerFactsServer).mockResolvedValue(careerFacts());
    vi.mocked(universityCrumbByCareer).mockResolvedValue(null);

    render(await CareerCrumbs({ params: Promise.resolve({ id: 'career-1' }) }));

    expect(screen.getByText('Carrera')).toBeInTheDocument();
  });

  it('un pedido que falla no tira la página: migas genéricas', async () => {
    vi.mocked(fetchCareerFactsServer).mockRejectedValue(
      new Error('Career facts fetch failed: 500'),
    );

    render(await CareerCrumbs({ params: Promise.resolve({ id: 'career-1' }) }));

    expect(screen.getByText('Carrera')).toBeInTheDocument();
  });
});
