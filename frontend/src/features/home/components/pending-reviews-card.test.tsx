import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PendingReview } from '../data/to-review';
import { PendingReviewsCard } from './pending-reviews-card';

const review: PendingReview = {
  code: 'ISW301',
  name: 'Ingeniería de Software I',
  prof: 'Brandt',
  closed: '2025·2c',
  note: 8,
};

describe('PendingReviewsCard', () => {
  it('muestra el conteo + año del período cuando hay reseñas pendientes', () => {
    render(<PendingReviewsCard reviews={[review, { ...review, code: 'BD301' }]} year={2026} />);
    expect(screen.getByText(/2 materias cerradas en 2025/)).toBeInTheDocument();
  });

  it('renderea code, name, prof y nota por cada review', () => {
    render(<PendingReviewsCard reviews={[review]} year={2026} />);
    expect(screen.getByText('ISW301')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Software I')).toBeInTheDocument();
    expect(screen.getByText('Brandt · nota 8')).toBeInTheDocument();
  });

  it('muestra "sin nota" cuando note es null', () => {
    render(<PendingReviewsCard reviews={[{ ...review, note: null }]} year={2026} />);
    expect(screen.getByText('Brandt · sin nota')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay reseñas', () => {
    render(<PendingReviewsCard reviews={[]} year={2026} />);
    expect(screen.getByText(/Cuando cierres una materia/)).toBeInTheDocument();
  });

  it('CTA "Reseñar →" queda disabled (TODO US-017)', () => {
    render(<PendingReviewsCard reviews={[review]} year={2026} />);
    const cta = screen.getByRole('button', { name: /reseñar/i });
    expect(cta).toBeDisabled();
  });
});
