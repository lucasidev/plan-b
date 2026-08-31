import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReviewedChair } from '../lib/reviewed-chairs';
import { ReviewedChairsCard } from './reviewed-chairs-card';

function chair(over: Partial<ReviewedChair> = {}): ReviewedChair {
  return {
    chairId: 'chair-1',
    chairName: 'Pérez',
    subjectName: 'Base de datos',
    termLabel: '2025-C2',
    ownReviews: 1,
    voices: null,
    isPublished: null,
    missingToPublish: null,
    ...over,
  };
}

describe('ReviewedChairsCard', () => {
  it('no dibuja nada sin cátedras: la pantalla decide, no una lista vacía', () => {
    const { container } = render(<ReviewedChairsCard chairs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('cada fila lleva a la ficha de su cátedra, que es donde el conteo real sí está', () => {
    render(<ReviewedChairsCard chairs={[chair({ chairId: 'abc' })]} />);

    expect(screen.getByRole('link', { name: /cátedra pérez/i })).toHaveAttribute(
      'href',
      '/chairs/abc',
    );
  });

  it('el slot del conteo está inerte y dice que falta el dato, nunca un número', () => {
    render(<ReviewedChairsCard chairs={[chair()]} />);

    const slot = screen.getByText(/voces: sin dato/i);
    expect(slot).toHaveAttribute('aria-disabled', 'true');
  });

  it('nunca muestra un cero: la cátedra puede tener doce reseñas y este slot no las sabe', () => {
    const { container } = render(<ReviewedChairsCard chairs={[chair()]} />);
    expect(container.textContent).not.toMatch(/\b0 voces\b/);
  });

  it('dice cuántas cursadas propias hay solo cuando es más de una', () => {
    const { rerender, container } = render(<ReviewedChairsCard chairs={[chair()]} />);
    expect(container.textContent).not.toMatch(/cursadas tuyas/i);

    rerender(<ReviewedChairsCard chairs={[chair({ ownReviews: 3 })]} />);
    expect(screen.getByText(/3 cursadas tuyas/i)).toBeInTheDocument();
  });

  it('no promete ningún puntaje ni marcador personal', () => {
    const { container } = render(
      <ReviewedChairsCard chairs={[chair(), chair({ chairId: 'b', chairName: 'Ruiz' })]} />,
    );
    expect(container.textContent).not.toMatch(/★|puntaje|ranking|promedio|nivel|racha/i);
  });
});
