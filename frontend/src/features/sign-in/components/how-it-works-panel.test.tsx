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

  it('el ejemplo de la ficha muestra la moda con su etiqueta literal y la distribución', () => {
    render(<HowItWorksPanel />);
    expect(screen.getByText('Faltaron muchas · 57 %')).toBeInTheDocument();
    expect(
      screen.getByText(/casi todas 22 · faltaron algunas 21 · faltaron muchas 57 · de 34/i),
    ).toBeInTheDocument();
  });

  it('no promete el producto retirado ni ningún puntaje', () => {
    const { container } = render(<HowItWorksPanel />);
    expect(container.textContent).not.toMatch(/planific|choque|ranking|★|mejores docentes/i);
  });

  /**
   * Auditoría R6: la frase, las opciones, la materia y el período del ejemplo tienen que salir del
   * catálogo vigente (`docs/product/phrases.md`, `CatalogSeedData`, `AcademicSeedData`), nunca de
   * un tercer cuestionario inventado para esta pantalla.
   */
  it('la frase y las opciones del ejemplo son las del instrumento vigente, no uno inventado', () => {
    render(<HowItWorksPanel />);

    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();
    expect(
      screen.getByText('¿Contestaba las preguntas que le hacían en clase?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Siempre')).toBeInTheDocument();
    expect(screen.getByText('Nadie preguntaba')).toBeInTheDocument();

    // La frase y las opciones que este panel mostraba antes no pertenecen a ningún instrumento.
    expect(screen.queryByText(/se dieron todas las clases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/se cayeron clases sin reprogramar/i)).not.toBeInTheDocument();
  });

  it('la materia y el período del ejemplo son los del catálogo, no un código inventado', () => {
    render(<HowItWorksPanel />);

    expect(screen.getByText(/fundamentos de control de calidad · 2025-c2/i)).toBeInTheDocument();
    expect(screen.queryByText(/isw302/i)).not.toBeInTheDocument();
  });
});
