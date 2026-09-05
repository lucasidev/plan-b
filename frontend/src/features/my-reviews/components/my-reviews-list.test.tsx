import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentInstrument } from '@/components/instrument';
import type { MyReview } from '../types';
import { MyReviewsList } from './my-reviews-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** Un instrumento mínimo, con la única frase que esta tarjeta necesita traducir. */
const INSTRUMENT: CurrentInstrument = {
  code: 'TEST',
  version: 1,
  items: [
    {
      code: 'COURSE_OUTCOME',
      text: '¿Cómo terminó esa cursada?',
      help: null,
      layer: 'Context',
      origin: 'Seed',
      options: [
        { value: 1, label: 'La aprobé' },
        { value: 2, label: 'Me quedó regular' },
        { value: 3, label: 'La recursé' },
        { value: 4, label: 'La dejé' },
      ],
    },
  ],
};

function review(over: Partial<MyReview> = {}): MyReview {
  return {
    id: 'review-1',
    subjectId: 'subject-1',
    subjectName: 'Análisis Matemático II',
    subjectCode: '211',
    termId: 'term-1',
    termLabel: '2025-C1',
    chairId: 'chair-1',
    chairName: 'Pérez',
    answeredItems: 3,
    answers: [],
    freeText: null,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
    ...over,
  };
}

describe('MyReviewsList', () => {
  /**
   * SC-018, estado "sin aportes todavía": la pantalla explica qué es esta lista y ofrece Reseñar.
   */
  it('estado "sin aportes": explica qué es la lista y ofrece reseñar', () => {
    render(<MyReviewsList reviews={[]} instrument={null} />);

    expect(screen.getByText('Todavía no reseñaste ninguna cursada.')).toBeInTheDocument();
    expect(screen.getByText(/lo que reseñes acá se publica solo en conteos/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reseñar una cursada/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  /**
   * SC-018, estado "publicado": la materia, el período, la cátedra y cuántas preguntas contestó.
   */
  it('estado "publicado": materia, período, cátedra y preguntas contestadas', () => {
    render(<MyReviewsList reviews={[review()]} instrument={null} />);

    expect(screen.getByRole('heading', { name: 'Análisis Matemático II' })).toBeInTheDocument();
    expect(screen.getByText('2025-C1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cátedra pérez/i })).toHaveAttribute(
      'href',
      '/chairs/chair-1',
    );
    expect(screen.getByText(/3 preguntas contestadas/)).toBeInTheDocument();
  });

  /**
   * US-148, edge case: una reseña sin cátedra marcada ("no me acuerdo") lo dice, en vez de omitir
   * la fila o inventar una cátedra.
   */
  it('estado "publicado" sin cátedra: dice que no la declaró', () => {
    render(
      <MyReviewsList reviews={[review({ chairId: null, chairName: null })]} instrument={null} />,
    );

    expect(screen.getByText(/sin cátedra declarada/i)).toBeInTheDocument();
  });

  /**
   * ADR-0084: el campo libre se ve en la tarjeta propia con su aviso de que no se publica; es el
   * único lugar del producto donde el autor vuelve a leer lo que escribió.
   */
  it('el campo libre se ve en la tarjeta propia, con su aviso de que no se publica', () => {
    render(
      <MyReviewsList
        reviews={[review({ freeText: 'Nunca supimos con qué se rendía el final.' })]}
        instrument={null}
      />,
    );

    expect(screen.getByText('Nunca supimos con qué se rendía el final.')).toBeInTheDocument();
    expect(
      screen.getByText(/esto no se publica: lo lee el equipo para descubrir qué falta preguntar/i),
    ).toBeInTheDocument();
  });

  /**
   * Ficha SC-018 ("Publicado"): "Cómo terminaste esa cursada se ve acá, aunque nunca se publique
   * con la reseña: es tu propio registro, no lo público" (US-148, "Dónde se resuelve"). El
   * desenlace viaja en `answers` como cualquier otra frase (`COURSE_OUTCOME`, optionValue 1 = "La
   * aprobé": mismo mapeo que usa `chair-facts.spec.ts`), y `ReviewCard` lo traduce con el
   * instrumento vigente, igual que `review-editor.tsx`.
   */
  it('US-148: cómo terminó la cursada se ve en la tarjeta como registro propio', () => {
    render(
      <MyReviewsList
        reviews={[review({ answers: [{ itemCode: 'COURSE_OUTCOME', optionValue: 1 }] })]}
        instrument={INSTRUMENT}
      />,
    );

    expect(screen.getByText(/aprob/i)).toBeInTheDocument();
    expect(screen.getByText(/no se publica/i)).toBeInTheDocument();
  });

  /**
   * Sin instrumento vigente no hay con qué traducir la opción a etiqueta, así que la línea no se
   * dibuja: mejor nada que un componente roto.
   */
  it('sin instrumento no dibuja el desenlace, y la tarjeta no rompe', () => {
    render(
      <MyReviewsList
        reviews={[review({ answers: [{ itemCode: 'COURSE_OUTCOME', optionValue: 1 }] })]}
        instrument={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Análisis Matemático II' })).toBeInTheDocument();
    expect(screen.queryByText(/cómo terminó/i)).not.toBeInTheDocument();
  });
});
