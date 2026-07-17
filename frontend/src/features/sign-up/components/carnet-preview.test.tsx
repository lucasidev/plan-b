import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CarnetPreview } from './carnet-preview';

describe('CarnetPreview', () => {
  it('renderiza el heading "Tu identidad, en dos formas."', () => {
    render(<CarnetPreview />);
    expect(
      screen.getByRole('heading', { name: /tu identidad, en dos formas/i }),
    ).toBeInTheDocument();
  });

  it('muestra los labels de carnet privado y público', () => {
    render(<CarnetPreview />);

    expect(screen.getByText('privado · solo vos', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('público · anónimo', { exact: false })).toBeInTheDocument();
  });

  it('no menciona UNSTA (copy genérico multi-universidad)', () => {
    render(<CarnetPreview />);
    expect(screen.queryByText(/unsta/i)).toBeNull();
  });
});
