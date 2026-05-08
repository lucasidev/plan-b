import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModPill } from './mod-pill';

describe('ModPill', () => {
  it('mapea "1c" a "Cuatri 1"', () => {
    render(<ModPill mod="1c" />);
    expect(screen.getByText('Cuatri 1')).toBeInTheDocument();
  });

  it('mapea "2c" a "Cuatri 2"', () => {
    render(<ModPill mod="2c" />);
    expect(screen.getByText('Cuatri 2')).toBeInTheDocument();
  });

  it('mapea "anual" a "Anual" con paleta approved', () => {
    render(<ModPill mod="anual" />);
    const pill = screen.getByText('Anual');
    expect(pill.className).toContain('bg-st-approved-bg');
  });

  it('cae a fallback con valor literal cuando recibe modalidad desconocida', () => {
    render(<ModPill mod="trimestral" />);
    const pill = screen.getByText('trimestral');
    expect(pill.className).toContain('bg-line');
  });

  it('renderea guion "-" cuando recibe string vacío', () => {
    render(<ModPill mod="" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
