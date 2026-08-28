import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpFaq } from './lp-faq';

describe('LpFaq', () => {
  it('renderiza el heading de la sección', () => {
    render(<LpFaq />);
    expect(
      screen.getByRole('heading', { name: /lo que probablemente te estés preguntando/i }),
    ).toBeInTheDocument();
  });

  it('renderiza las cinco preguntas', () => {
    render(<LpFaq />);
    expect(screen.getAllByText(/^¿/)).toHaveLength(5);
  });

  // Las dos que contestan lo que el producto decidió NO hacer. Si alguien las saca, la entrada
  // vuelve a dejar sin respuesta las dos cosas que más hacen dudar a quien llega.
  it('contesta por qué no hay puntaje y por qué algunas cátedras no muestran nada', () => {
    render(<LpFaq />);
    expect(screen.getByText(/¿Por qué no hay estrellas ni puntaje\?/)).toBeInTheDocument();
    expect(screen.getByText(/¿Por qué algunas cátedras no muestran nada\?/)).toBeInTheDocument();
  });
});
