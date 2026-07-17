import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInForm } from './sign-in-form';

/**
 * Sample tests for the "Components" tier of the pyramid (ADR-0036). We cover:
 *   - initial render (fields visible, submit disabled? no, only while pending)
 *   - happy path: typing + submit fires the action with the right values
 *   - error: the component renders alert + message when the action returns
 *     status: 'error'
 *   - "¿Olvidaste tu contraseña?" es un link inline al lado del label de password
 *
 * El link cross-flow "Creá tu cuenta" se movió al footer del AuthShell (a la página,
 * US-059-f), así que ya no se testea a nivel del form; lo cubre el E2E de sign-up.
 *
 * The action is mocked at the module level (`./actions`) so the component test does
 * not couple to server-side logic. Action details are covered in `actions.test.ts`.
 */

vi.mock('../actions', () => ({
  signInAction: vi.fn(),
}));

import { signInAction } from '../actions';

const actionMock = vi.mocked(signInAction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SignInForm', () => {
  it('renderiza email + password + submit "Entrar"', () => {
    render(<SignInForm />);

    expect(screen.getByLabelText(/tu email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('muestra el link "¿Olvidaste tu contraseña?" inline con el label de password', () => {
    render(<SignInForm />);
    expect(screen.getByRole('link', { name: /olvidaste tu contraseña/i })).toBeInTheDocument();
  });

  it('dispara el action con los valores del form al hacer submit', async () => {
    actionMock.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'doce-chars-1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(actionMock).toHaveBeenCalledTimes(1);
    // useActionState llama al action como (prevState, formData).
    // Verificamos que el FormData contiene los valores tipeados.
    const [, fd] = actionMock.mock.calls[0] as [unknown, FormData];
    expect(fd.get('email')).toBe('lucia@test.com');
    expect(fd.get('password')).toBe('doce-chars-1');
  });

  it('renderiza alert con el mensaje cuando el action devuelve status: error', async () => {
    actionMock.mockResolvedValue({
      status: 'error',
      kind: 'invalid_credentials',
      message: 'Email o contraseña incorrectos',
    });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'doce-chars-1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/email o contraseña incorrectos/i);
  });

  it('muestra el botón de resend cuando el kind es email_not_verified', async () => {
    actionMock.mockResolvedValue({
      status: 'error',
      kind: 'email_not_verified',
      message: 'Tu cuenta todavía no está verificada.',
      email: 'lucia@test.com',
    });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'doce-chars-1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/no llegó el mail/i)).toBeInTheDocument();
    // The resend button must be present after the error.
    expect(screen.getByRole('button', { name: /reenviar el link/i })).toBeInTheDocument();
  });
});
