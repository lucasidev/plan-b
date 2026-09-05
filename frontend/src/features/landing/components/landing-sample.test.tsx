import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChairFacts } from '@/features/chair-facts';
import { LandingSample } from './landing-sample';

function facts(overrides: Partial<ChairFacts> = {}): ChairFacts {
  return {
    chairId: 'c-1',
    chairName: 'Pérez',
    subjectId: 's-1',
    subjectName: 'Fundamentos de Control de Calidad',
    subjectCode: '211',
    leadTeacherName: 'Martín Pérez',
    isPublished: true,
    reviewCount: 31,
    reviewsMissingToPublish: 0,
    span: { fromYear: 2024, toYear: 2026, lastReviewedAt: null },
    fame: null,
    chairConduct: [
      {
        code: 'CHAIR_ANSWERS_IN_CLASS',
        text: '¿Contestaba las preguntas que le hacían en clase?',
        modeLabel: 'Casi nunca',
        modePercent: 87,
        modeIsNegative: true,
        total: 31,
        distribution: [
          { label: 'Siempre', percent: 0, isNegative: false },
          { label: 'A veces', percent: 13, isNegative: false },
          { label: 'Casi nunca', percent: 87, isNegative: true },
        ],
      },
      {
        code: 'CHAIR_CLASSES_HELD',
        text: '¿Se dictaron las clases?',
        modeLabel: 'Faltaron muchas',
        modePercent: 87,
        modeIsNegative: true,
        total: 31,
        distribution: [
          { label: 'Casi todas', percent: 13, isNegative: false },
          { label: 'Faltaron muchas', percent: 87, isNegative: true },
        ],
      },
      {
        code: 'CHAIR_EXAM_DATE_NOTICE',
        text: '¿Avisó la fecha del parcial con anticipación?',
        modeLabel: 'Menos de una semana',
        modePercent: 80,
        modeIsNegative: true,
        total: 30,
        distribution: [{ label: 'Menos de una semana', percent: 80, isNegative: true }],
      },
    ],
    studentExperience: [],
    completion: { outOfTen: 9, reaching: 28, total: 31 },
    contrasts: [],
    ...overrides,
  };
}

describe('LandingSample', () => {
  it('US-221 E1: muestra la ficha real con sus voces y su ventana temporal', () => {
    render(<LandingSample sample={facts()} />);

    expect(screen.getByRole('heading', { name: /cátedra pérez/i })).toBeInTheDocument();
    expect(screen.getByText(/211 · Fundamentos de Control de Calidad/)).toBeInTheDocument();
    expect(screen.getByText(/31 voces · de 2024 a 2026/)).toBeInTheDocument();
    expect(screen.getByText(/de cada 10 que la cursan, llegan 9/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver la ficha entera/i })).toHaveAttribute(
      'href',
      '/chairs/c-1',
    );
  });

  // US-171: la muestra no puede leerse como un destacado. Que lo diga la pantalla es parte de la
  // garantía, no una nota al pie: quien llega no tiene cómo saber que el sorteo existe.
  it('dice que la ficha salió sorteada y no elegida', () => {
    render(<LandingSample sample={facts()} />);
    expect(screen.getByText(/sale sorteada entre las que ya publican/i)).toBeInTheDocument();
    expect(screen.getByText(/no es la mejor ni la peor/i)).toBeInTheDocument();
  });

  // Muestra los dos primeros en el orden de la ficha. Recortar por "los peores" sería curar
  // exactamente lo que el producto promete no curar.
  it('enseña las dos primeras frases de la ficha, no una selección', () => {
    render(<LandingSample sample={facts()} />);

    expect(
      screen.getByText('¿Contestaba las preguntas que le hacían en clase?'),
    ).toBeInTheDocument();
    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();
    expect(
      screen.queryByText('¿Avisó la fecha del parcial con anticipación?'),
    ).not.toBeInTheDocument();
  });

  it('sin nada publicado lo dice, en vez de inventar un ejemplo', () => {
    const { container } = render(<LandingSample sample={null} />);

    expect(
      screen.getByText(/todavía ninguna cátedra juntó voces suficientes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/recién cuando junta 10 reseñas/i)).toBeInTheDocument();

    // Ni un solo conteo inventado para llenar el hueco.
    expect(container.textContent).not.toMatch(/de cada 10 que la cursan/i);
    expect(screen.queryByRole('link', { name: /ver la ficha entera/i })).not.toBeInTheDocument();
  });
});
