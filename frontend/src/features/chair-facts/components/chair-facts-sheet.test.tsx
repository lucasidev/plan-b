import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChairFacts } from '../types';
import { ChairFactsSheet } from './chair-facts-sheet';

// La ficha monta CatalogTopbar, que monta el buscador global: necesita router y QueryClient. Se le
// dan los dos en vez de mockear el buscador entero, mismo criterio que landing-hero.test.tsx.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function facts(over: Partial<ChairFacts> = {}): ChairFacts {
  return {
    chairId: 'chair-1',
    chairName: 'Pérez',
    subjectId: 'subject-1',
    subjectName: 'Análisis Matemático II',
    subjectCode: '211',
    leadTeacherName: null,
    isPublished: true,
    reviewCount: 37,
    reviewsMissingToPublish: 0,
    span: { fromYear: 2023, toYear: 2026, lastReviewedAt: null },
    fame: {
      itemsAgreeing: 3,
      items: [
        {
          code: 'CHAIR_CLASSES_HELD',
          text: '¿Se dictaron las clases?',
          negativeLabel: 'Faltaron muchas',
          percent: 80,
        },
        {
          code: 'CHAIR_ANSWERS_IN_CLASS',
          text: '¿Contestaba las preguntas que le hacían en clase?',
          negativeLabel: 'Casi nunca',
          percent: 85,
        },
        {
          code: 'CHAIR_PRACTICE_MATCHES_THEORY',
          text: '¿El práctico daba lo mismo que el teórico?',
          negativeLabel: 'Eran dos materias distintas',
          percent: 90,
        },
      ],
    },
    chairConduct: [],
    studentExperience: [],
    completion: null,
    contrasts: [],
    ...over,
  };
}

describe('ChairFactsSheet', () => {
  /**
   * US-131 N2: ninguna proporción se publica sin su "de N" al lado. La fama enuncia el porcentaje
   * de cada frase que converge ("el 80 %"); tiene que poder verificarse sin bajar al detalle, y
   * eso incluye saber sobre cuántas voces sale ese porcentaje ahí mismo, no en otro bloque de la
   * misma ficha.
   * Roto: #439, hasta 2026-09-30.
   */
  it.skip('cada hecho de la fama dice sobre cuántas voces sale, no solo el porcentaje', () => {
    // Roto: pendiente de número de issue (ver reporte de la barrida #407). La fama muestra el
    // porcentaje sin su "de N": Fame() en chair-facts-sheet.tsx no lo trae, y FameItemView
    // tampoco lo tiene en el backend (GetChairFactsResponse.cs).
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ChairFactsSheet facts={facts()} />
      </QueryClientProvider>,
    );

    const heading = screen.getByText('Los hechos que la marcan');
    const section = heading.closest('section');
    expect(section).not.toBeNull();

    expect(within(section as HTMLElement).getByText(/80 %/)).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(/de \d+/)).toBeInTheDocument();
  });
});
