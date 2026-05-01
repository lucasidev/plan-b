import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInForm } from './sign-in-form';

/**
 * Sample tests para la rama "Components" de la pirámide (ADR-0036).
 * Cubrimos:
 *   - render inicial (campos visibles, submit disabled? No, sólo durante pending)
 *   - happy path: typing + submit dispara el action con los valores correctos
 *   - error: el component renderiza alert + mensaje cuando el action devuelve
 *     status: 'error'
 *   - footer link: switch a sign-up llama al callback que recibe por prop
 *
 * El action está mockeado al nivel del módulo (`./actions`) para no acoplar
 * el component test al server-side. El detalle del action vive en
 * `actions.test.ts`.
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
    render(<SignInForm onSwitchToSignUp={() => {}} />);

    expect(screen.getByLabelText(/tu email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('muestra el link "¿Olvidaste tu contraseña?" en el footer', () => {
    render(<SignInForm onSwitchToSignUp={() => {}} />);
    expect(screen.getByRole('link', { name: /olvidaste tu contraseña/i })).toBeInTheDocument();
  });

  it('llama al callback onSwitchToSignUp cuando se clickea "Creá tu cuenta"', async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    render(<SignInForm onSwitchToSignUp={onSwitch} />);

    await user.click(screen.getByRole('button', { name: /creá tu cuenta/i }));

    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('dispara el action con los valores del form al hacer submit', async () => {
    actionMock.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<SignInForm onSwitchToSignUp={() => {}} />);

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
    render(<SignInForm onSwitchToSignUp={() => {}} />);

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'doce-chars-1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/email o contraseña incorrectos/i);
  });

  it('muestra hint de "Registrate de nuevo" cuando el kind es email_not_verified', async () => {
    actionMock.mockResolvedValue({
      status: 'error',
      kind: 'email_not_verified',
      message: 'Tu cuenta todavía no está verificada.',
    });
    const user = userEvent.setup();
    render(<SignInForm onSwitchToSignUp={() => {}} />);

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'doce-chars-1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/no llegó el mail/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /registrate de nuevo con el mismo email/i }),
    ).toBeInTheDocument();
  });
});
