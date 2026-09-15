import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CareerCoverage } from '../types';
import { SingleInstitutionCareerList } from './single-institution-career-list';

/**
 * "En una sola institución" (US-222, ADR-0096, maqueta aprobada): filas compactas, las primeras
 * doce, sin pill por fila: en una lista de cientos, "sin reseñas todavía" repetido en casi todas
 * las filas no suma nada.
 */

vi.mock('@/components/layout/fallback-link', () => ({
  FallbackLink: ({
    children,
    prefetch,
    ...props
  }: ComponentProps<'a'> & { prefetch?: boolean }) => {
    void prefetch;
    return (
      <a data-navigation-fallback="true" {...props}>
        {children}
      </a>
    );
  },
}));

function career(overrides: Partial<CareerCoverage>): CareerCoverage {
  return {
    careerId: 'career-id',
    careerName: 'Carrera',
    universityId: 'uni-id',
    universityName: 'Universidad',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...overrides,
  };
}

/** N carreras distintas, ya en el orden en que las mostraría `groupCareersByCanonical` (alfabético). */
function careers(count: number): CareerCoverage[] {
  return Array.from({ length: count }, (_, index) =>
    career({
      careerId: `career-${index}`,
      careerName: `Carrera ${String(index).padStart(2, '0')}`,
      universityId: 'uni-id',
      universityName: 'UNT',
    }),
  );
}

describe('SingleInstitutionCareerList', () => {
  it('cada fila es un link a su carrera, con el nombre y la institución corta a la derecha', () => {
    render(
      <SingleInstitutionCareerList
        careers={[career({ careerId: 'x', careerName: 'Geología', universityId: 'unt' })]}
        universityShortNames={new Map([['unt', 'UNT']])}
      />,
    );

    const link = screen.getByRole('link', { name: /geología/i });
    expect(link).toHaveAttribute('href', '/careers/x');
    expect(link).toHaveTextContent('UNT');
  });

  it('protege la navegación de cada fila con el fallback medido en CI', () => {
    render(
      <SingleInstitutionCareerList
        careers={[career({ careerId: 'x', careerName: 'Geología' })]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.getByRole('link', { name: /geología/i })).toHaveAttribute(
      'data-navigation-fallback',
      'true',
    );
  });

  it('cae al nombre de la oferta si el mapa no tiene esa institución', () => {
    render(
      <SingleInstitutionCareerList
        careers={[career({ careerId: 'x', universityId: 'unse', universityName: 'UNSE' })]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.getByRole('link', { name: /unse/i })).toBeInTheDocument();
  });

  it('con 12 o menos, muestra todas y no agrega el footer de "se muestran"', () => {
    render(<SingleInstitutionCareerList careers={careers(12)} universityShortNames={new Map()} />);

    expect(screen.getAllByRole('link')).toHaveLength(12);
    expect(screen.queryByText(/se muestran/i)).not.toBeInTheDocument();
  });

  it('con más de 12, corta en las primeras 12 (en el orden recibido) y agrega el footer', () => {
    render(<SingleInstitutionCareerList careers={careers(15)} universityShortNames={new Map()} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAccessibleName(/carrera 00/i);
    expect(links[11]).toHaveAccessibleName(/carrera 11/i);
    expect(screen.getByText('Se muestran 12 de 15. Buscá la tuya con ⌘K.')).toBeInTheDocument();
  });

  it('sin carreras, no renderiza nada', () => {
    const { container } = render(
      <SingleInstitutionCareerList careers={[]} universityShortNames={new Map()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('no muestra ninguna pill de reseñas por fila', () => {
    render(
      <SingleInstitutionCareerList
        careers={[career({ careerId: 'x', voiceCount: 5 })]}
        universityShortNames={new Map()}
      />,
    );

    expect(screen.queryByText(/reseñas?/i)).not.toBeInTheDocument();
  });
});
