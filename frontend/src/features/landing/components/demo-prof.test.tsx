import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoProf } from './demo-prof';

describe('DemoProf', () => {
  it('renderiza el nombre del docente y las 3 barras de rating', () => {
    render(<DemoProf />);

    expect(screen.getByText('Federico Brandt')).toBeInTheDocument();
    expect(screen.getByText('Claridad')).toBeInTheDocument();
    expect(screen.getByText('Exigencia')).toBeInTheDocument();
    expect(screen.getByText('Buena onda')).toBeInTheDocument();
  });
});
