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
    expect(screen.getByText(/de 16 voces$/)).toBeInTheDocument();
    expect(screen.getByText(/de 112 voces$/)).toBeInTheDocument();
    expect(screen.queryByText(/de 128 voces$/)).not.toBeInTheDocument();
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
    expect(screen.getByText(/de 112 voces$/)).toBeInTheDocument();
    expect(screen.getByText(/no se comparan/)).toBeInTheDocument();
  });

  /**
   * La opacidad sobre texto rompe el contraste mínimo (design-system.md): la serie anterior se
   * distingue por el divisor y por el tono del enunciado, nunca atenuando la tarjeta entera.
   */
  it('la serie anterior no se atenúa con opacidad', () => {
    const { container } = render(
      <ItemRow item={{ ...base, previousSeries: previous }} last={false} />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      expect(node.style.opacity).toBe('');
    }

    const previousQuestion = screen.getByText('¿Se dictaron las clases?');
    expect(previousQuestion).toHaveClass('text-ink-2');
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

  /** La moda va en mono, como `.mode` de la maqueta: sin esto hereda la tipografía de cuerpo. */
  it('la moda va en IBM Plex Mono', () => {
    render(<ItemRow item={base} last={false} />);

    expect(screen.getByText('Faltaron muchas · 44 %')).toHaveStyle({
      fontFamily: 'var(--font-mono)',
    });
  });

  /**
   * El denominador de la frase pluraliza: "de 1 voz" y no "de 1 voces". Es el caso de un tramo
   * nuevo (US-198) recién estrenado, que arranca en 0 y la primera respuesta lo lleva a 1.
   */
  it('con total 1, dice "de 1 voz"', () => {
    render(
      <ItemRow
        item={{
          ...base,
          modePercent: 100,
          total: 1,
          distribution: [{ label: 'Faltaron muchas', percent: 100, isNegative: true }],
        }}
        last={false}
      />,
    );

    expect(screen.getByText(/de 1 voz$/)).toBeInTheDocument();
  });
});
