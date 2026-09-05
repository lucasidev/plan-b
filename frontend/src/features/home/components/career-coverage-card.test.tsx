import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CareerFacts } from '@/features/career-facts/types';
import { CareerCoverageCard } from './career-coverage-card';

function facts(over: Partial<CareerFacts> = {}): CareerFacts {
  return {
    careerId: 'career-1',
    careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
    totalSubjects: 51,
    coveredSubjects: 23,
    coveragePercent: 45,
    ...over,
  } as CareerFacts;
}

describe('CareerCoverageCard', () => {
  it('US-231 E2: muestra la cobertura como fracción del plan y lleva a la ficha de la carrera', () => {
    render(<CareerCoverageCard facts={facts()} />);

    expect(screen.getByText(/23 de 51 materias/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver la ficha de/i })).toHaveAttribute(
      'href',
      '/careers/career-1',
    );
  });

  it('dice cuántas faltan y por qué, no solo el número', () => {
    render(<CareerCoverageCard facts={facts()} />);
    expect(screen.getByText(/las 28 restantes/i)).toBeInTheDocument();
    expect(screen.getByText(/10 reseñas del piso/i)).toBeInTheDocument();
  });

  it('la carrera sin nada medido no es impecable, es desconocida, y lo dice', () => {
    render(<CareerCoverageCard facts={facts({ coveredSubjects: 0, coveragePercent: 0 })} />);
    expect(screen.getByText(/ninguna materia junta todavía/i)).toBeInTheDocument();
  });

  it('la carrera sin materias cargadas no dice "0 de 0" a secas', () => {
    render(
      <CareerCoverageCard
        facts={facts({ totalSubjects: 0, coveredSubjects: 0, coveragePercent: 0 })}
      />,
    );
    expect(screen.getByText(/no tenemos materias cargadas/i)).toBeInTheDocument();
  });

  it('la carrera medida entera lo dice sin celebrarlo', () => {
    render(<CareerCoverageCard facts={facts({ coveredSubjects: 51, coveragePercent: 100 })} />);
    expect(screen.getByText(/todas sus materias ya juntan/i)).toBeInTheDocument();
  });

  it('US-231 X1: el número es del plan y nunca se presenta como logro de la cuenta', () => {
    const { container } = render(<CareerCoverageCard facts={facts()} />);
    expect(container.textContent).not.toMatch(
      /llevás|tu progreso|lograste|completaste|nivel|racha|★|puntaje/i,
    );
  });
});
