import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingHero } from './landing-hero';

// El hero monta el buscador global, que necesita router y QueryClient. Se le dan los dos en vez de
// mockear el buscador entero: lo que se prueba acá es el copy de la entrada, y el buscador de
// verdad tiene su propio recorrido en el E2E, contra el catálogo real.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function renderHero() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <LandingHero />
    </QueryClientProvider>,
  );
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
  // qué es esto, y pedirle cuenta antes de mostrarle un dato invierte el orden de la tesis.
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
    expect(screen.queryByRole('link', { name: /crear cuenta/i })).not.toBeInTheDocument();
  });

  it('dice que leer no pide cuenta, sin que haya que descubrirlo', () => {
    renderHero();
    expect(screen.getByText(/leer no pide cuenta/i)).toBeInTheDocument();
  });

  // ADR-0083: la entrada no promete un puntaje porque el producto no publica ninguno.
  it('no promete puntajes ni el planificador retirado', () => {
    const { container } = renderHero();
    expect(container.textContent).not.toMatch(/planific|comisión|comisiones|puntaje de|★/i);
  });
});
