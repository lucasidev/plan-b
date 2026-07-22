import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingHero } from './landing-hero';

describe('LandingHero', () => {
  it('renderiza el heading principal con el copy "pasaron por ahí"', () => {
    render(<LandingHero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/pasaron por ahí/i);
  });

  it('muestra el link "Crear cuenta gratis" hacia /sign-up', () => {
    render(<LandingHero />);
    expect(screen.getByRole('link', { name: /crear cuenta gratis/i })).toHaveAttribute(
      'href',
      '/sign-up',
    );
  });

  it('muestra el link "Ver cómo funciona" hacia #features', () => {
    render(<LandingHero />);
    expect(screen.getByRole('link', { name: /ver cómo funciona/i })).toHaveAttribute(
      'href',
      '#features',
    );
  });

  it('muestra las propuestas de valor del producto', () => {
    render(<LandingHero />);
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.getByText('Independiente')).toBeInTheDocument();
  });
});
