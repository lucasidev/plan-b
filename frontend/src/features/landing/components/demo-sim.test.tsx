import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoSim } from './demo-sim';

describe('DemoSim', () => {
  it('renderiza el panel de selección y el preview en vivo', () => {
    render(<DemoSim />);

    expect(screen.getByText('Selección')).toBeInTheDocument();
    expect(screen.getByText(/preview en vivo/i)).toBeInTheDocument();
  });

  it('renderiza materias con su código', () => {
    render(<DemoSim />);
    expect(screen.getAllByText('ISW302').length).toBeGreaterThan(0);
  });
});
