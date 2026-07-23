import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoPlanner } from './demo-planner';

describe('DemoPlanner', () => {
  it('renderiza las cuatro facetas del planificador', () => {
    render(<DemoPlanner />);

    // Semana simulada con su choque. Aparece dos veces: la primera cara se repite al
    // final del track para que el reinicio del loop sea invisible.
    expect(screen.getAllByText('Semana simulada')).toHaveLength(2);
    expect(screen.getAllByText(/1 choque/)).toHaveLength(2);
    expect(screen.getAllByText('MOV')).toHaveLength(2);
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
