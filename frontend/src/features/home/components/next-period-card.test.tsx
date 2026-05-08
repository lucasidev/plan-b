import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NextPeriodCard } from './next-period-card';

describe('NextPeriodCard', () => {
  it('renderea el texto del eyebrow + body con el nextYear', () => {
    render(<NextPeriodCard nextYear={2027} />);
    expect(screen.getByText('Pensando en lo que viene')).toBeInTheDocument();
    expect(screen.getByText(/Armá un borrador de 2027/)).toBeInTheDocument();
  });

  it('CTA "Planificar {year} →" disabled (TODO US-016)', () => {
    render(<NextPeriodCard nextYear={2027} />);
    const cta = screen.getByRole('button', { name: /planificar 2027/i });
    expect(cta).toBeDisabled();
  });
});
