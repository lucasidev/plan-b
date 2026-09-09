import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReviewCta } from './review-cta';

/**
 * SC-005: el cierre de la ficha de institución. Sin esto, una institución sin datos termina en el
 * checklist de transparencia y no tiene salida.
 */
describe('ReviewCta', () => {
  it('invita a reseñar y linkea al href que decide la página', () => {
    render(<ReviewCta href="/reviews/new" />);

    expect(screen.getByText('¿Estudiás acá?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reseñá tu cursada/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  /** El gate de sesión lo decide `reviewCtaHref`, no este componente: solo reusa el href que le dan. */
  it('respeta el href del gate de sesión cuando no hay cuenta', () => {
    render(<ReviewCta href="/sign-in?from=%2Freviews%2Fnew" />);

    expect(screen.getByRole('link', { name: /reseñá tu cursada/i })).toHaveAttribute(
      'href',
      '/sign-in?from=%2Freviews%2Fnew',
    );
  });

  /** SC-005: la cobertura por lote (cuántas carreras sin datos) todavía no tiene read agregado, así que el llamado no inventa un número. */
  it('no menciona un número de carreras sin datos', () => {
    render(<ReviewCta href="/reviews/new" />);

    expect(screen.queryByText(/\d+ carreras/i)).not.toBeInTheDocument();
  });
});
