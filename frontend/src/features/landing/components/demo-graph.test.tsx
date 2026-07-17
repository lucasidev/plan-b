import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoGraph } from './demo-graph';

describe('DemoGraph', () => {
  it('renderiza los códigos de las materias del grafo', () => {
    render(<DemoGraph />);

    expect(screen.getByText('MAT101')).toBeInTheDocument();
    expect(screen.getByText('INT302')).toBeInTheDocument();
  });
});
