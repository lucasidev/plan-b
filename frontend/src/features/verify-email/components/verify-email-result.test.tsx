import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VerifyEmailResult } from './verify-email-result';

/**
 * US-229, L03: después de verificar el mail, "Iniciar sesión" tiene que llevar de vuelta a lo
 * que la persona estaba haciendo, no a un `/sign-in` pelado. La página ya sanitizó `from`
 * (viene de la cookie que dejó el registro); acá solo se verifica que el link lo propague.
 */
describe('VerifyEmailResult', () => {
  it('con from, "Iniciar sesión" vuelve a la acción que la trajo', () => {
    render(
      <VerifyEmailResult
        result={{ kind: 'success', verifiedAt: '2026-09-09' }}
        from="/reviews/new"
      />,
    );

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
      'href',
      '/sign-in?from=%2Freviews%2Fnew',
    );
  });

  it('sin from, "Iniciar sesión" va al Ingresar de siempre', () => {
    render(<VerifyEmailResult result={{ kind: 'success', verifiedAt: '2026-09-09' }} />);

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('already_consumed también propaga el from', () => {
    render(<VerifyEmailResult result={{ kind: 'already_consumed' }} from="/reviews/new" />);

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
      'href',
      '/sign-in?from=%2Freviews%2Fnew',
    );
  });
});
