import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthErrorBanner } from './auth-error-banner';

/**
 * Tests del banner de error compartido de auth (US-059-f). Cubre que expone el
 * rol accesible correcto (para que el lector de pantalla lo anuncie tras el
 * submit) y que renderea contenido arbitrario: el mensaje solo, o el mensaje
 * más una acción (el caso de sign-in con el botón de reenviar verificación).
 */
describe('AuthErrorBanner', () => {
  it('renderiza el mensaje dentro de un role="alert"', () => {
    render(<AuthErrorBanner>Email o contraseña incorrectos</AuthErrorBanner>);
    expect(screen.getByRole('alert')).toHaveTextContent(/email o contraseña incorrectos/i);
  });

  it('renderiza children arbitrarios (mensaje + acción)', () => {
    render(
      <AuthErrorBanner>
        <p>Tu cuenta todavía no está verificada.</p>
        <button type="button">Reenviar el link</button>
      </AuthErrorBanner>,
    );
    expect(screen.getByText(/no está verificada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar el link/i })).toBeInTheDocument();
  });
});
