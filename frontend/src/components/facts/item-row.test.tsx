import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemRow } from './item-row';
import type { PublishedItem } from './types';

/**
 * La frase publicada y, cuando la pregunta cambió, sus dos tramos (US-198 E3, ADR-0083).
 *
 * Lo que estos tests protegen no es el layout: es que la ficha no pueda leerse como si dos
 * porcentajes de dos preguntas distintas midieran lo mismo.
 */
describe('ItemRow', () => {
  const base: PublishedItem = {
    code: 'CHAIR_CLASSES_HELD_B',
    text: '¿Se dictaron todas las clases del cronograma?',
    modeLabel: 'Faltaron muchas',
    modePercent: 44,
    modeIsNegative: true,
    total: 16,
    distribution: [
      { label: 'Casi todas', percent: 31, isNegative: false },
      { label: 'Faltaron algunas', percent: 25, isNegative: false },
      { label: 'Faltaron muchas', percent: 44, isNegative: true },
    ],
  };

  const previous: PublishedItem = {
    code: 'CHAIR_CLASSES_HELD',
    text: '¿Se dictaron las clases?',
    modeLabel: 'Faltaron muchas',
    modePercent: 50,
    modeIsNegative: true,
    total: 112,
    distribution: [
      { label: 'Casi todas', percent: 21, isNegative: false },
      { label: 'Faltaron algunas', percent: 29, isNegative: false },
      { label: 'Faltaron muchas', percent: 50, isNegative: true },
    ],
    retiredAt: '2026-08-21T00:00:00Z',
  };

  it('muestra un solo tramo cuando la pregunta nunca cambió', () => {
    render(<ItemRow item={base} last={false} />);

    expect(screen.getByText('¿Se dictaron todas las clases del cronograma?')).toBeInTheDocument();
    expect(screen.queryByText(/no se comparan/)).not.toBeInTheDocument();
  });

  /** US-198 E3: lo de antes queda bajo el código viejo, lo de después bajo el nuevo. */
  it('muestra los dos tramos con sus propios enunciados y totales', () => {
    render(<ItemRow item={{ ...base, previousSeries: previous }} last={false} />);

    expect(screen.getByText('¿Se dictaron todas las clases del cronograma?')).toBeInTheDocument();
    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();

    // Cada tramo con su propio "de N": si estuvieran sumados habría un solo 128.
    expect(screen.getByText(/de 16$/)).toBeInTheDocument();
    expect(screen.getByText(/de 112$/)).toBeInTheDocument();
    expect(screen.queryByText(/de 128$/)).not.toBeInTheDocument();
  });

  /**
   * La línea entre los dos tramos es lo que impide que se lean como comparables. Sin ella, un 44 %
   * arriba de un 50 % parece una mejora, y son respuestas a dos preguntas distintas.
   */
  it('separa los tramos diciendo que no se comparan, con la fecha del corte', () => {
    render(<ItemRow item={{ ...base, previousSeries: previous }} last={false} />);

    const separator = screen.getByText(/no se comparan/);
    expect(separator).toHaveTextContent('acá cambió la pregunta');
    expect(separator).toHaveTextContent('agosto de 2026');
  });

  it('sin fecha de corte, igual dice que los tramos no se comparan', () => {
    const undated = { ...previous, retiredAt: null };

    render(<ItemRow item={{ ...base, previousSeries: undated }} last={false} />);

    expect(
      screen.getByText('acá cambió la pregunta, los tramos no se comparan'),
    ).toBeInTheDocument();
  });

  /**
   * El estado inmediatamente después del corte: la pregunta nueva todavía no la contestó nadie, y
   * el tramo viejo sigue publicándose. Sin esto, cambiar una pregunta borraría de la ficha todo lo
   * respondido a la anterior hasta que alguien contestara la nueva.
   */
  it('con la pregunta nueva sin responder, muestra igual el tramo de antes', () => {
    const pending: PublishedItem = {
      ...base,
      modeLabel: '',
      modePercent: 0,
      modeIsNegative: false,
      total: 0,
      distribution: [],
      previousSeries: previous,
    };

    render(<ItemRow item={pending} last={false} />);

    expect(screen.getByText('Todavía nadie respondió esta pregunta.')).toBeInTheDocument();
    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();
    expect(screen.getByText(/de 112$/)).toBeInTheDocument();
    expect(screen.getByText(/no se comparan/)).toBeInTheDocument();
  });

  /** El badge lleva la etiqueta literal elegida, nunca un número inventado (ADR-0083). */
  it('cada tramo lleva su propia moda con su etiqueta literal', () => {
    const { container } = render(
      <ItemRow item={{ ...base, previousSeries: previous }} last={false} />,
    );

    const badges = within(container).getAllByText(/Faltaron muchas · \d+ %/);
    expect(badges.map((b) => b.textContent)).toEqual([
      'Faltaron muchas · 44 %',
      'Faltaron muchas · 50 %',
    ]);
  });
});
