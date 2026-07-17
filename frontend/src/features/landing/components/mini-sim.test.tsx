import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MiniSim } from './mini-sim';

describe('MiniSim', () => {
  it('renderiza el panel de selección y el preview en vivo', () => {
    render(<MiniSim />);

    expect(screen.getByText('Selección')).toBeInTheDocument();
    expect(screen.getByText(/preview en vivo/i)).toBeInTheDocument();
  });

  it('renderiza materias con su código', () => {
    render(<MiniSim />);
    expect(screen.getAllByText('ISW302').length).toBeGreaterThan(0);
  });
});
