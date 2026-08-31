import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorksPanel } from './how-it-works-panel';

describe('HowItWorksPanel', () => {
  it('muestra el título y los tres pasos', () => {
    render(<HowItWorksPanel />);
    expect(screen.getByText('Así funciona plan-b.')).toBeInTheDocument();
    expect(screen.getByText(/leé lo que ya respondieron los que cursaron/i)).toBeInTheDocument();
    expect(screen.getByText(/reseñá una cursada que hiciste/i)).toBeInTheDocument();
    expect(screen.getByText(/nada se publica con menos de diez voces/i)).toBeInTheDocument();
  });

  it('el demo de la ficha muestra la moda con su etiqueta literal y la distribución', () => {
    render(<HowItWorksPanel />);
    expect(screen.getByText('Casi nunca · 59 %')).toBeInTheDocument();
    expect(
      screen.getByText(/casi nunca 59 · a veces 24 · casi siempre 17 · de 34/i),
    ).toBeInTheDocument();
  });

  it('no promete el producto retirado ni ningún puntaje', () => {
    const { container } = render(<HowItWorksPanel />);
    expect(container.textContent).not.toMatch(/planific|choque|ranking|★|mejores docentes/i);
  });
});
