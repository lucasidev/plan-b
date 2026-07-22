import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorksPanel } from './how-it-works-panel';

describe('HowItWorksPanel', () => {
  it('muestra el título y los tres pasos de las herramientas', () => {
    render(<HowItWorksPanel />);
    expect(screen.getByText('Así funciona plan-b.')).toBeInTheDocument();
    expect(screen.getByText(/leé quién ya pasó por esa materia/i)).toBeInTheDocument();
    expect(screen.getByText(/armá tu cuatri y evitá los choques/i)).toBeInTheDocument();
    expect(screen.getByText(/elegí con quién cursás/i)).toBeInTheDocument();
  });

  it('renderiza los demos de ejemplo de cada herramienta', () => {
    render(<HowItWorksPanel />);
    expect(screen.getByText(/pesada pero te enseña de verdad/i)).toBeInTheDocument();
    expect(screen.getByText(/1 choque/i)).toBeInTheDocument();
    expect(screen.getByText('Mejores docentes')).toBeInTheDocument();
  });
});
