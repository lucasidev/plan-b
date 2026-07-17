import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { INDEPENDENT_PROJECT_DISCLAIMER } from '@/lib/copy';
import { LpFooter } from './lp-footer';

describe('LpFooter', () => {
  it('muestra "proyecto independiente"', () => {
    render(<LpFooter />);
    expect(screen.getByText(/proyecto independiente/i)).toBeInTheDocument();
  });

  it('muestra el disclaimer de no afiliación compartido', () => {
    render(<LpFooter />);
    expect(screen.getByText(INDEPENDENT_PROJECT_DISCLAIMER)).toBeInTheDocument();
  });

  it('no menciona UNSTA (copy genérico multi-universidad)', () => {
    render(<LpFooter />);
    expect(screen.queryByText(/unsta/i)).toBeNull();
  });
});
