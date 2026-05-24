import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeactivateAccountButton } from './deactivate-account-button';

/**
 * Component tests para `DeactivateAccountButton` (ADR-0044, US-038-bis frontend).
 * Mockeamos el server action a nivel módulo: este test cubre el wiring del
 * modal (anti-accidental email check, ESC, cancel, error rendering). El
 * detalle del action vive en `actions.test.ts`.
 */

vi.mock('../actions', () => ({
  deactivateAccountAction: vi.fn(async () => ({ status: 'idle' })),
}));

import { deactivateAccountAction } from '../actions';

const actionMock = vi.mocked(deactivateAccountAction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeactivateAccountButton', () => {
  it('renderiza el CTA y mantiene el modal cerrado por default', () => {
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);

    expect(screen.getByRole('button', { name: /dar de baja mi cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el modal con copy de confirmación al click del CTA', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);

    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/lucia@unsta\.edu\.ar/i)).toBeInTheDocument();
  });

  it('mantiene "Dar de baja la cuenta" disabled hasta que el email matche', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    const submit = screen.getByRole('button', { name: /dar de baja la cuenta/i });
    expect(submit).toBeDisabled();

    const input = screen.getByLabelText(/tu email/i);
    await user.type(input, 'lucia@unsta.edu.ar');
    expect(submit).toBeEnabled();
  });

  it('matchea email case-insensitive', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    await user.type(screen.getByLabelText(/tu email/i), 'LUCIA@UNSTA.EDU.AR');
    expect(screen.getByRole('button', { name: /dar de baja la cuenta/i })).toBeEnabled();
  });

  it('muestra mensaje inline cuando el email tipeado no coincide', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    await user.type(screen.getByLabelText(/tu email/i), 'mateo@gmail.com');

    expect(screen.getByRole('alert')).toHaveTextContent(/no coincide/i);
  });

  it('cierra el modal al click en Cancelar y limpia el typed', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@unsta.edu.ar');
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reabrir confirma que el typed se limpió.
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));
    expect(screen.getByLabelText(/tu email/i)).toHaveValue('');
  });

  it('cierra el modal al ESC', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no llama al action cuando el email no matchea (botón disabled)', async () => {
    const user = userEvent.setup();
    render(<DeactivateAccountButton email="lucia@unsta.edu.ar" />);
    await user.click(screen.getByRole('button', { name: /dar de baja mi cuenta/i }));

    await user.type(screen.getByLabelText(/tu email/i), 'wrong@email.com');

    expect(screen.getByRole('button', { name: /dar de baja la cuenta/i })).toBeDisabled();
    expect(actionMock).not.toHaveBeenCalled();
  });
});
