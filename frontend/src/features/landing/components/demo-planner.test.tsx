import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoPlanner } from './demo-planner';

describe('DemoPlanner', () => {
  it('renderiza las tres facetas del planificador', () => {
    render(<DemoPlanner />);

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
