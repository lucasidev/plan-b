import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingHero } from './landing-hero';

function renderHero() {
  return render(<LandingHero />);
}

describe('LandingHero', () => {
  it('renderiza el heading principal con la tesis en palabras de lector', () => {
    renderHero();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/una anécdota/i);
    // El número del título es el piso de publicación real, no una cifra retórica.
    expect(heading).toHaveTextContent(/diez, un hecho/i);
  });

  // Los dos CTA de la entrada son de lectura y ninguno de registro: quien llega todavía no sabe
  // qué es esto, y pedirle cuenta antes de mostrarle un dato invierte el orden de la tesis. El
  // link a Método no es un tercer CTA: es la regla detrás del número, en el propio párrafo.
  it('sus dos CTA llevan a leer, no a registrarse', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /explorar carreras y materias/i })).toHaveAttribute(
      'href',
      '/universities',
    );
    expect(screen.getByRole('link', { name: /ver una ficha de verdad/i })).toHaveAttribute(
      'href',
      '#sample',
    );
    expect(screen.getByRole('link', { name: /método/i })).toHaveAttribute('href', '/method');
    expect(screen.queryByRole('link', { name: /crear cuenta/i })).not.toBeInTheDocument();
  });

  // ADR-0083: la entrada no promete un puntaje porque el producto no publica ninguno.
  it('no promete puntajes ni el planificador retirado', () => {
    const { container } = renderHero();
    expect(container.textContent).not.toMatch(/planific|comisión|comisiones|puntaje de|★/i);
  });
});
