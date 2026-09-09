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

  /**
   * Auditoría R6: el carnet público no cita el texto de ninguna reseña (THESIS.md: ninguna
   * reseña individual se muestra, el campo libre no se publica). Lo único público es la
   * identidad anónima (carrera, año, período), no una opinión con comillas.
   */
  it('el carnet público no cita el texto de ninguna reseña', () => {
    const { container } = render(<CarnetPreview />);
    expect(container.textContent).not.toMatch(/["“].+["”]/);
    expect(screen.queryByText(/isw302/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/brandt/i)).not.toBeInTheDocument();
  });
});
