import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CareerFacts } from '@/features/career-facts/types';
import { HomeEmptyState } from './home-empty-state';

function facts(over: Partial<CareerFacts> = {}): CareerFacts {
  return {
    careerId: 'career-1',
    careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
    universityName: 'UNSTA',
    durationYears: 3,
    totalSubjects: 51,
    coveredSubjects: 23,
    coveragePercent: 45,
    editorialNotes: [],
    ...over,
  };
}

/**
 * SC-011, estado sin reseñas: no es el mismo layout con menos cosas ni una lista vacía, es una
 * pantalla propia que dice el piso de publicación y ofrece una sola acción.
 */
describe('HomeEmptyState', () => {
  it('US-231 N1: dice a partir de cuántas reseñas publica una cátedra', () => {
    render(<HomeEmptyState firstName="Ana" facts={null} />);
    expect(screen.getByText(/a partir de (diez|10) rese/i)).toBeInTheDocument();
  });

  it('US-231 N1: ofrece una sola acción, reseñar una cursada, a /reviews/new', () => {
    render(<HomeEmptyState firstName="Ana" facts={null} />);
    const actionLinks = screen.getAllByRole('link');
    expect(actionLinks).toHaveLength(1);
    expect(actionLinks[0]).toHaveAccessibleName(/reseñar una cursada/i);
    expect(actionLinks[0]).toHaveAttribute('href', '/reviews/new');
  });

  it('US-231 N1: no muestra ningún progreso personal, solo la cobertura del plan', () => {
    const { container } = render(<HomeEmptyState firstName="Ana" facts={facts()} />);
    expect(container.textContent).not.toMatch(/llevás|de 10\b/i);
  });

  it('US-231 X3: no sugiere qué cursar, ni horarios, ni un orden de cursada', () => {
    const { container } = render(<HomeEmptyState firstName="Ana" facts={null} />);
    expect(container.textContent).not.toMatch(
      /te recomendamos|te sugerimos|deberías cursar|orden sugerido|horario sugerido/i,
    );
  });
});
