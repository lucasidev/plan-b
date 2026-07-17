import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VerifiedBadge } from './verified-badge';

/**
 * Tests del badge de verificación (US-059-f). El foco es la generalización
 * multi-universidad: el badge de docente dejó de decir "docente UNSTA" y ahora
 * es agnóstico a la institución.
 */
describe('VerifiedBadge', () => {
  it('por defecto muestra el badge de alumno "verificado que cursó"', () => {
    render(<VerifiedBadge />);
    expect(screen.getByText(/verificado que cursó/i)).toBeInTheDocument();
  });

  it('con kind="teacher" muestra "docente verificado", sin nombrar ninguna universidad', () => {
    render(<VerifiedBadge kind="teacher" />);
    expect(screen.getByText(/docente verificado/i)).toBeInTheDocument();
    expect(screen.queryByText(/unsta/i)).toBeNull();
  });
});
