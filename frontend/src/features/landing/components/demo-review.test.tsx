import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoReview } from './demo-review';

describe('DemoReview', () => {
  it('renderiza materia, docente y parte del texto de la reseña', () => {
    render(<DemoReview />);

    expect(screen.getByText('ISW302')).toBeInTheDocument();
    expect(screen.getByText('Brandt')).toBeInTheDocument();
    expect(screen.getByText(/TP final/i)).toBeInTheDocument();
  });
});
