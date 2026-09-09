import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentInstrument } from '@/components/instrument';
import type { MyReview } from '../types';
import { MyReviewsList } from './my-reviews-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** Un instrumento mínimo, con las frases que esta tarjeta necesita traducir. */
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
    {
      code: 'SE_CLASSES_HELD',
      text: '¿Se dictaron las clases?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Faltaron muchas' },
        { value: 2, label: 'Casi siempre' },
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
        reviews={[
          review({
            answers: [
              {
                itemCode: 'COURSE_OUTCOME',
                optionValue: 1,
                optionVoices: null,
                itemTotalVoices: null,
              },
            ],
          }),
        ]}
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
        reviews={[
          review({
            answers: [
              {
                itemCode: 'COURSE_OUTCOME',
                optionValue: 1,
                optionVoices: null,
                itemTotalVoices: null,
              },
            ],
          }),
        ]}
        instrument={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Análisis Matemático II' })).toBeInTheDocument();
    expect(screen.queryByText(/cómo terminó/i)).not.toBeInTheDocument();
  });

  /**
   * US-162 (E1): por cada frase que respondiste en esa cátedra, la opción elegida y las voces que
   * suma ahora ("ahora 12 de 40 voces", SC-018).
   */
  it('US-162: cada frase respondida en la cátedra muestra la opción elegida y sus voces', () => {
    render(
      <MyReviewsList
        reviews={[
          review({
            answers: [
              {
                itemCode: 'SE_CLASSES_HELD',
                optionValue: 1,
                optionVoices: 12,
                itemTotalVoices: 40,
              },
            ],
          }),
        ]}
        instrument={INSTRUMENT}
      />,
    );

    expect(screen.getByText(/¿se dictaron las clases\?/i)).toBeInTheDocument();
    expect(screen.getByText('Faltaron muchas')).toBeInTheDocument();
    expect(screen.getByText(/ahora suma 12 de 40 voces/i)).toBeInTheDocument();
  });

  /**
   * Sin cátedra declarada el backend no manda voces para esa frase (quedan null): no se dibuja
   * ninguna línea inventada.
   */
  it('US-162: sin voces para esa frase no dibuja ninguna línea', () => {
    render(
      <MyReviewsList
        reviews={[
          review({
            chairId: null,
            chairName: null,
            answers: [
              {
                itemCode: 'SE_CLASSES_HELD',
                optionValue: 1,
                optionVoices: null,
                itemTotalVoices: null,
              },
            ],
          }),
        ]}
        instrument={INSTRUMENT}
      />,
    );

    expect(screen.queryByText(/¿se dictaron las clases\?/i)).not.toBeInTheDocument();
  });

  /**
   * El desenlace no entra a la lista de voces por frase aunque el backend le mande conteos: ya
   * tiene su propia línea arriba (US-148), y listarlo dos veces sería redundante.
   */
  it('US-162: el desenlace no aparece en la lista de voces por frase', () => {
    render(
      <MyReviewsList
        reviews={[
          review({
            answers: [
              { itemCode: 'COURSE_OUTCOME', optionValue: 1, optionVoices: 8, itemTotalVoices: 15 },
            ],
          }),
        ]}
        instrument={INSTRUMENT}
      />,
    );

    expect(screen.queryByText(/ahora suma 8 de 15 voces/i)).not.toBeInTheDocument();
  });

  /**
   * Sin instrumento vigente no hay con qué traducir la opción a etiqueta: la lista de voces no se
   * dibuja, y la tarjeta no rompe.
   */
  it('US-162: sin instrumento no dibuja la lista de voces, y la tarjeta no rompe', () => {
    render(
      <MyReviewsList
        reviews={[
          review({
            answers: [
              {
                itemCode: 'SE_CLASSES_HELD',
                optionValue: 1,
                optionVoices: 12,
                itemTotalVoices: 40,
              },
            ],
          }),
        ]}
        instrument={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Análisis Matemático II' })).toBeInTheDocument();
    expect(screen.queryByText(/ahora suma/i)).not.toBeInTheDocument();
  });
});
