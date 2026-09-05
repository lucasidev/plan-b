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

  it('US-231 X1: no promete ningún puntaje ni marcador personal', () => {
    const { container } = render(
      <ReviewedChairsCard chairs={[chair(), chair({ chairId: 'b', chairName: 'Ruiz' })]} />,
    );
    expect(container.textContent).not.toMatch(/★|puntaje|ranking|promedio|nivel|racha/i);
  });

  it('US-231 E1: la cátedra que cruzó el piso dice su conteo y que publica, sin festejarlo', () => {
    render(
      <ReviewedChairsCard
        chairs={[chair({ voices: 12, isPublished: true, missingToPublish: 0 })]}
      />,
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/voces · publica/)).toBeInTheDocument();

    // Publicar no es un logro: no hay felicitación ni marca de meta cumplida.
    expect(screen.queryByText(/felicit|lograst|¡|meta/i)).not.toBeInTheDocument();
  });

  it('US-231 E1: la que no llega dice cuántas le faltan, en plural y en singular', () => {
    render(
      <ReviewedChairsCard
        chairs={[
          chair({
            chairId: 'a',
            chairName: 'Ruiz',
            voices: 9,
            isPublished: false,
            missingToPublish: 1,
          }),
          chair({
            chairId: 'b',
            chairName: 'Gómez',
            voices: 6,
            isPublished: false,
            missingToPublish: 4,
          }),
        ]}
      />,
    );

    expect(screen.getByText(/voces · le falta una/)).toBeInTheDocument();
    expect(screen.getByText(/voces · le faltan 4/)).toBeInTheDocument();
  });

  it('US-231 E1, X2: las dos conviven en la misma lista, cada una con lo suyo', () => {
    render(
      <ReviewedChairsCard
        chairs={[
          chair({
            chairId: 'a',
            chairName: 'Pérez',
            voices: 12,
            isPublished: true,
            missingToPublish: 0,
          }),
          chair({
            chairId: 'b',
            chairName: 'Ruiz',
            voices: 9,
            isPublished: false,
            missingToPublish: 1,
          }),
        ]}
      />,
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/voces · publica/)).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/voces · le falta una/)).toBeInTheDocument();

    // X2: de una cátedra reseñada se ve el conteo, nunca qué se contestó.
    expect(screen.queryByText(/respondiste|tu respuesta|contestaste/i)).not.toBeInTheDocument();
  });

  it('US-231 X3: no sugiere qué cursar, ni horarios, ni un orden de cursada', () => {
    const { container } = render(
      <ReviewedChairsCard chairs={[chair(), chair({ chairId: 'b', chairName: 'Ruiz' })]} />,
    );
    expect(container.textContent).not.toMatch(
      /te recomendamos|te sugerimos|deberías cursar|orden sugerido|horario sugerido/i,
    );
  });
});
