import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpCtaFinal } from './lp-cta-final';

describe('LpCtaFinal', () => {
  it('cierra invitando a reseñar una cursada, no a planificar', () => {
    render(<LpCtaFinal />);
    expect(
      screen.getByRole('heading', { name: /¿cursaste alguna\? reseñala/i }),
    ).toBeInTheDocument();
  });

  it('muestra el link "Crear cuenta" hacia /sign-up', () => {
    render(<LpCtaFinal />);
    expect(screen.getByRole('link', { name: /crear cuenta/i })).toHaveAttribute('href', '/sign-up');
  });
});
