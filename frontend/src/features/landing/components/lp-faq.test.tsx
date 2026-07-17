import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpFaq } from './lp-faq';

describe('LpFaq', () => {
  it('renderiza el heading de la sección', () => {
    render(<LpFaq />);
    expect(
      screen.getByRole('heading', { name: /lo que probablemente te estés preguntando/i }),
    ).toBeInTheDocument();
  });

  it('renderiza las 4 preguntas del FAQ', () => {
    render(<LpFaq />);

    expect(screen.getByText('¿plan-b está afiliada con mi universidad?')).toBeInTheDocument();
    expect(screen.getByText('¿Pueden los profesores ver quién los reseñó?')).toBeInTheDocument();
    expect(screen.getByText('¿Tengo que cargar todo mi historial?')).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué pasa con las reseñas viejas si cambia el profesor?'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^¿/)).toHaveLength(4);
  });
});
