import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LastActivityPanel } from './last-activity-panel';

describe('LastActivityPanel', () => {
  it('renderiza el heading "Te dejaste cosas a medio."', () => {
    render(<LastActivityPanel />);
    expect(screen.getByRole('heading', { name: /te dejaste cosas a medio/i })).toBeInTheDocument();
  });

  it('renderiza los 3 stats de actividad', () => {
    render(<LastActivityPanel />);

    expect(screen.getByText('reseñas tuyas')).toBeInTheDocument();
    expect(screen.getByText('borradores')).toBeInTheDocument();
    expect(screen.getByText('sin leer')).toBeInTheDocument();
  });

  it('renderiza el label "Última actividad"', () => {
    render(<LastActivityPanel />);
    expect(screen.getByText('Última actividad')).toBeInTheDocument();
  });

  it('no menciona UNSTA (copy genérico multi-universidad)', () => {
    render(<LastActivityPanel />);
    expect(screen.queryByText(/unsta/i)).toBeNull();
  });
});
