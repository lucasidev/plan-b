import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Movement } from '../data/movements';
import { MovementsCard } from './movements-card';

const items: Movement[] = [
  { id: '1', timestamp: 'hace 2h', body: 'Brandt respondió a tu reseña de ISW301' },
  { id: '2', timestamp: 'hace 1d', body: 'Nueva reseña en INT302 (4★)' },
];

describe('MovementsCard', () => {
  it('renderea timestamp + body por cada item', () => {
    render(<MovementsCard movements={items} />);
    expect(screen.getByText('hace 2h')).toBeInTheDocument();
    expect(screen.getByText(/Brandt respondió/)).toBeInTheDocument();
    expect(screen.getByText('hace 1d')).toBeInTheDocument();
  });

  it('muestra empty state cuando el feed está vacío', () => {
    render(<MovementsCard movements={[]} />);
    expect(screen.getByText('Sin novedades por ahora.')).toBeInTheDocument();
  });
});
