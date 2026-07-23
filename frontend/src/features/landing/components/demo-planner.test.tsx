import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoPlanner } from './demo-planner';

describe('DemoPlanner', () => {
  it('renderiza las cuatro facetas del planificador', () => {
    render(<DemoPlanner />);

    // Semana simulada con su choque.
    expect(screen.getByText('Semana simulada')).toBeInTheDocument();
    expect(screen.getByText(/1 choque/)).toBeInTheDocument();
    expect(screen.getByText('MOV')).toBeInTheDocument();
    // Métricas de la combinación.
    expect(screen.getByText('Tu combinación')).toBeInTheDocument();
    expect(screen.getByText('18h')).toBeInTheDocument();
    // Correlativas bloqueantes.
    expect(screen.getByText('Esta combinación no se puede cursar')).toBeInTheDocument();
    // Comparador de comisiones.
    expect(screen.getByText('INT302 · elegí comisión')).toBeInTheDocument();
    expect(screen.getByText('Com B')).toBeInTheDocument();
  });
});
