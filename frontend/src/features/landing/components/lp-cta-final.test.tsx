import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpCtaFinal } from './lp-cta-final';

describe('LpCtaFinal', () => {
  it('renderiza el heading de cierre', () => {
    render(<LpCtaFinal />);
    expect(
      screen.getByRole('heading', { name: /empezá a planificar el cuatrimestre que viene/i }),
    ).toBeInTheDocument();
  });

  it('muestra el link "Crear cuenta con email institucional" hacia /sign-up', () => {
    render(<LpCtaFinal />);
    expect(
      screen.getByRole('link', { name: /crear cuenta con email institucional/i }),
    ).toHaveAttribute('href', '/sign-up');
  });
});
