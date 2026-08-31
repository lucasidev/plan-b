import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePaths } from './home-paths';

describe('HomePaths', () => {
  it('linkea a explorar el catálogo, reseñar una cursada y mis aportes', () => {
    render(<HomePaths />);

    expect(screen.getByRole('link', { name: /explorar carreras y materias/i })).toHaveAttribute(
      'href',
      '/universities',
    );
    expect(screen.getByRole('link', { name: /reseñar una cursada/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
    expect(screen.getByRole('link', { name: /mis aportes/i })).toHaveAttribute(
      'href',
      '/reviews/mine',
    );
  });

  it('no muestra ningún número: nada de conteos, rachas ni puntajes inventados (ADR-0086)', () => {
    render(<HomePaths />);
    expect(screen.getByRole('list').textContent).not.toMatch(/\d/);
  });
});
